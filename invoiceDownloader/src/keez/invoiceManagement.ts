import * as luxon from "luxon";
import Stripe from "stripe";
import * as _ from "lodash";
import axios from "axios";
import xml2js from "xml2js";
import fs from "fs";
import path from "path";

import { KeezApi } from "./keezApi";
import { getExceptionMessage, throwError } from "../error";
import { COUNTRY_NAMES_BY_CODE } from "./keezConstants";
import { promiseAllBatched } from "../functional";
import {
  KeezInvoice,
  KeezInvoiceDetail,
  KeezItem,
  KeezParter,
} from "./keezTypes";

export async function uploadInvoicesToKeez({
  keez,
  stripe,
  stripeInvoices,
}: {
  keez: KeezApi;
  stripe: Stripe;
  stripeInvoices: Stripe.Invoice[];
}) {
  const { keezItems, stripePriceMap } = await upsertKeezItems({
    keez,
    stripeInvoices,
    stripe,
  });

  console.log("uploading invoices to keez ...");
  const keezTierToItemMap = new Map<string, KeezItem>(
    keezItems.map((item) => [item.name, item])
  );

  // it seems that sometimes the invoices are not ordered by number, which keez kinda requires
  // so we need to sort them
  const stripeInvoicesOrdered = stripeInvoices.sort(
    sortStripeInvoiceBySeriesAndNumberAsc
  );

  // upload invoices to keez
  const { newKeezInvoices, existingKeezInvoices } = await createKeezInvoices({
    keez,
    stripe,
    stripeInvoicesOrdered,
    keezTierToItemMap,
    stripePriceMap,
  });
  let allKeezInvoicesToValidate = existingKeezInvoices.concat(newKeezInvoices);
  await validateKeezInvoices({ keez, keezInvoices: allKeezInvoicesToValidate });

  const allKeezInvoices = existingKeezInvoices.concat(newKeezInvoices);
  await promiseAllBatched(allKeezInvoices, 10, async (invoice) => {
    await downloadInvoicePdf({
      keez,
      invoiceId: invoice.externalId ?? throwError("Missing ID"),
      invoiceNumber: `${invoice.series}-${invoice.number}`,
    });
  });

  // // testing - delete the invoices if they're already uploaded
  // await deleteInvoicesFromKeez({
  //   keez,
  //   keezInvoices: existingKeezInvoices.sort(
  //     sortKeezInvoiceBySeriesAndNumberDesc
  //   ),
  // });

  const { reverseKeezInvoices, existingReverseKeezInvoices } =
    await createReverseInvoices({
      keez,
      stripe,
      stripeInvoices: stripeInvoicesOrdered,
      keezTierToItemMap,
      stripePriceMap,
    });
  allKeezInvoicesToValidate = reverseKeezInvoices.concat(
    existingReverseKeezInvoices
  );
  await validateKeezInvoices({ keez, keezInvoices: allKeezInvoicesToValidate });

  const allReverseKeezInvoices =
    existingReverseKeezInvoices.concat(reverseKeezInvoices);
  await promiseAllBatched(allReverseKeezInvoices, 10, async (invoice) => {
    await downloadInvoicePdf({
      keez,
      invoiceId: invoice.externalId ?? throwError("Missing ID"),
      invoiceNumber: `${invoice.series}-${invoice.number}`,
    });
  });

  // // testing - delete the invoices if they're already uploaded
  // await deleteInvoicesFromKeez({
  //   keez,
  //   keezInvoices: existingReverseKeezInvoices.sort(
  //     sortKeezInvoiceBySeriesAndNumberDesc
  //   ),
  // });
}

const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const toKeezItemNameCode = (tier: string, variant?: string) =>
  `First 2 Apply ${capitalize(tier)}${
    variant ? ` - ${variant.toLowerCase()}` : ""
  }`;
async function upsertKeezItems({
  keez,
  stripeInvoices,
  stripe,
}: {
  keez: KeezApi;
  stripeInvoices: Stripe.Invoice[];
  stripe: Stripe;
}) {
  // check if we have items in keez for the invoices
  console.log("checking if keez has all required items ...");
  let keezItems = await keez.listItems();

  const stripeItems: Stripe.InvoiceLineItem[] = [];
  for (const invoice of stripeInvoices) {
    const items = invoice.lines.data;
    stripeItems.push(...items);
  }

  const priceIds = new Set(
    stripeItems
      .map((li) =>
        li.pricing?.type === "price_details"
          ? li.pricing.price_details?.price
          : undefined
      )
      .filter((id): id is string => !!id)
  );

  const stripePriceMap = new Map<string, Stripe.Price>();
  await Promise.all(
    [...priceIds].map(async (id) => {
      stripePriceMap.set(id, await stripe.prices.retrieve(id));
    })
  );

  console.log(`fetched ${stripeItems.length} items from Stripe`);
  const usedTiers = [
    ...new Set(
      stripeItems
        .map((li) => {
          if (li.pricing?.type !== "price_details") return undefined;
          const price = stripePriceMap.get(
            li.pricing.price_details?.price ?? ""
          );
          return price?.metadata.tier;
        })
        .filter((t): t is string => !!t)
    ),
  ];

  // we need two versions for each item, one for ro clients and one for non-ro clients
  const usedTierCodes = usedTiers.flatMap((tier) => [
    toKeezItemNameCode(tier),
    toKeezItemNameCode(tier, `ro`),
  ]);

  const unkownTiers = usedTierCodes.filter(
    (tierCode) => !keezItems.find((item) => item.name === tierCode)
  );
  if (unkownTiers.length > 0) {
    console.log(
      `unkown tiers: ${unkownTiers.join(", ")}, creating them in keez ...`
    );
    for (const tier of unkownTiers) {
      // invoices for romanian clients have a different category
      const categoryExternalId = tier.endsWith(" - ro")
        ? "MISCSRV"
        : "SRV_ELECTR";
      const newKeezItem = await keez.createItem({
        name: tier,
        categoryExternalId, // Misc Services
        currencyCode: "USD", // hard coded for now
        isActive: true,
        measureUnitId: 1,
      });
      keezItems.push(newKeezItem);
    }
    console.log("new tiers created");
  }

  return { keezItems, stripePriceMap };
}

async function createKeezInvoices({
  keez,
  stripe,
  stripeInvoicesOrdered,
  keezTierToItemMap,
  stripePriceMap,
}: {
  keez: KeezApi;
  stripe: Stripe;
  stripeInvoicesOrdered: Stripe.Invoice[];
  keezTierToItemMap: Map<string, KeezItem>;
  stripePriceMap: Map<string, Stripe.Price>;
}) {
  const newKeezInvoices: KeezInvoice[] = [];
  const existingKeezInvoices: KeezInvoice[] = [];
  for (const invoice of stripeInvoicesOrdered) {
    console.log(`Creating invoice ${invoice.number} ...`);
    // check if the invoice is already uploaded
    const { series, number } = getInvoiceSeriesAndNumber(invoice);
    const existingInvoice = await keez.getInvoiceBySeriesAndNumber(
      series,
      parseInt(number)
    );
    if (existingInvoice) {
      console.log(`Invoice ${invoice.number} already uploaded to Keez`);
      existingKeezInvoices.push(existingInvoice);
      continue;
    }

    const keezInvoice = await createKeezInvoiceFromStripeInvoice({
      keez,
      stripe,
      stripeInvoice: invoice,
      keezTierToItemMap,
      stripePriceMap,
    });
    newKeezInvoices.push(keezInvoice);
  }
  console.log(
    `finished creating ${stripeInvoicesOrdered.length} invoices in Keez`
  );

  return { newKeezInvoices, existingKeezInvoices };
}

async function createKeezInvoiceFromStripeInvoice({
  keez,
  stripeInvoice,
  stripe,
  keezTierToItemMap,
  stripePriceMap,
  isStorno = false,
}: {
  keez: KeezApi;
  stripe: Stripe;
  stripeInvoice: Stripe.Invoice;
  keezTierToItemMap: Map<string, KeezItem>;
  stripePriceMap: Map<string, Stripe.Price>;
  isStorno?: boolean;
}) {
  const { series, number } = getInvoiceSeriesAndNumber(stripeInvoice);

  const countryCode =
    stripeInvoice.customer_address?.country ??
    throwError("Missing country code");
  const isRomanianInvoice = countryCode === "RO";
  const exchangeRate = isRomanianInvoice
    ? await getExchangeRate({
        day: luxon.DateTime.fromSeconds(stripeInvoice.created).toFormat(
          "yyyy-MM-dd"
        ),
        currency: stripeInvoice.currency,
      })
    : 1;

  let countyName =
    stripeInvoice.customer_address?.state ||
    stripeInvoice.customer_address?.city ||
    "";
  if (countyName.toLowerCase().trim() === "bucharest") {
    countyName = "Bucuresti"; // București
  }
  const countryName =
    COUNTRY_NAMES_BY_CODE[countryCode] ?? throwError("Unknown country");
  const partner: KeezParter = {
    partnerName: stripeInvoice.customer_name || throwError("Unnamed Customer"),
    isLegalPerson: false,
    countryCode,
    countryName,
    cityName: stripeInvoice.customer_address?.city || countryName,
    countyName,
    addressDetails: `${stripeInvoice.customer_address?.line1} ${
      stripeInvoice.customer_address?.line2 || ""
    }`,
  };

  const comments: string[] = [];
  if (isStorno) {
    comments.push(
      `Stornare factura numarul ${series}${number} din data ${luxon.DateTime.fromSeconds(
        stripeInvoice.created
      ).toFormat("dd.MM.yyyy")}`
    );
  }

  const multiplier = isStorno ? -1 : 1;
  const totalTax =
    stripeInvoice.total_taxes?.reduce((acc, tax) => acc + tax.amount, 0) ?? 0;
  const vatAmountCurrency = multiplier * totalTax;
  let vatPercent = 0;
  const usedTaxRate = stripeInvoice.total_taxes?.find((tax) => tax.amount > 0);
  if (usedTaxRate) {
    const taxRateId =
      usedTaxRate.tax_rate_details?.tax_rate ??
      throwError("Missing tax rate ID");
    const taxRate = await stripe.taxRates.retrieve(taxRateId);
    vatPercent = taxRate.percentage;
  }

  const invoiceDetails = stripeInvoice.lines.data
    .map((item): KeezInvoiceDetail => {
      const price =
        stripePriceMap.get(item.pricing?.price_details?.price ?? "") ??
        throwError("Missing price details");
      const tier = price.metadata.tier;
      if (!tier) {
        throw new Error(`Item ${item.id} does not have a tier`);
      }

      const keezItemName = toKeezItemNameCode(
        tier,
        isRomanianInvoice ? "ro" : ""
      );
      const keezItem = keezTierToItemMap.get(keezItemName);
      if (!keezItem) {
        throw new Error(`Item ${tier} not found in Keez`);
      }

      if (item.period?.start && item.period?.end) {
        comments.push(
          `Period: ${luxon.DateTime.fromSeconds(item.period.start).toFormat(
            "MMM dd, yyyy"
          )} - ${luxon.DateTime.fromSeconds(item.period.end).toFormat(
            "MMM dd, yyyy"
          )}`
        );
      }

      const unitPriceCurrency =
        price.unit_amount ?? throwError("Missing unit price");
      const quantity = item.quantity ?? throwError("Missing quantity");
      const originalNetAmountCurrency = item.amount; // total item price without discount

      const discountAmountCurrency =
        item.discount_amounts?.reduce(
          (acc, discount) => acc + discount.amount,
          0
        ) ?? 0;
      const netAmountCurrency =
        originalNetAmountCurrency - discountAmountCurrency;

      const originalVatAmountCurrency =
        originalNetAmountCurrency * (vatPercent / 100);
      const vatAmountCurrency = netAmountCurrency * (vatPercent / 100);
      const discountVatAmountCurrency =
        originalVatAmountCurrency - vatAmountCurrency;
      const hasDiscount = discountAmountCurrency !== 0;

      return {
        itemExternalId:
          keezItem.externalId ?? throwError("Missing external ID"),
        itemName: keezItem.name,
        itemDescription: item.description ?? throwError("Missing description"),
        measureUnitId: keezItem.measureUnitId ?? throwError("Missing measure"),
        // if the price is negative make sure the quantity is negative too
        quantity:
          originalNetAmountCurrency < 0 ? -quantity : quantity * multiplier,
        // quantity: multiplier * quantity,

        unitPriceCurrency: fromCents(unitPriceCurrency),
        unitPrice: fromCents(
          convertCurrency({
            value: unitPriceCurrency,
            exchangeRate,
            decimals: 4,
          })
        ),
        // unitPriceCurrency: Math.abs(fromCents(netAmountCurrency)),
        // unitPrice: Math.abs(
        //   fromCents(
        //     convertCurrency({
        //       value: netAmountCurrency,
        //       exchangeRate,
        //       decimals: 4,
        //     })
        //   )
        // ),

        netAmountCurrency: multiplier * fromCents(netAmountCurrency),
        netAmount:
          multiplier *
          fromCents(
            convertCurrency({
              value: netAmountCurrency,
              exchangeRate,
              decimals: 2,
            })
          ),
        grossAmountCurrency:
          multiplier * fromCents(netAmountCurrency + vatAmountCurrency),
        grossAmount:
          multiplier *
          fromCents(
            convertCurrency({
              value: netAmountCurrency + vatAmountCurrency,
              exchangeRate,
              decimals: 2,
            })
          ),
        originalNetAmountCurrency:
          multiplier * fromCents(originalNetAmountCurrency),
        originalNetAmount:
          multiplier *
          fromCents(
            convertCurrency({
              value: originalNetAmountCurrency,
              exchangeRate,
              decimals: 2,
            })
          ),

        // VAT
        vatPercent,
        vatAmountCurrency: multiplier * vatAmountCurrency,
        vatAmount:
          multiplier *
          fromCents(
            convertCurrency({
              value: vatAmountCurrency,
              exchangeRate,
              decimals: 2,
            })
          ),
        originalVatAmountCurrency:
          multiplier * fromCents(originalVatAmountCurrency),
        originalVatAmount:
          multiplier *
          fromCents(
            convertCurrency({
              value: originalVatAmountCurrency,
              exchangeRate,
              decimals: 2,
            })
          ),

        // Discount
        ...(hasDiscount && {
          discountType: "Value",
          discountValueOnNet: true,

          discountNetValueCurrency:
            multiplier * fromCents(discountAmountCurrency),
          discountNetValue:
            multiplier *
            fromCents(
              convertCurrency({
                value: discountAmountCurrency,
                exchangeRate,
                decimals: 2,
              })
            ),
          discountVatValueCurrency:
            multiplier * fromCents(discountVatAmountCurrency),
          discountVatValue:
            multiplier *
            fromCents(
              convertCurrency({
                value: discountVatAmountCurrency,
                exchangeRate,
                decimals: 2,
              })
            ),
          discountGrossValueCurrency:
            multiplier *
            fromCents(discountAmountCurrency + discountVatAmountCurrency),
          discountGrossValue:
            multiplier *
            fromCents(
              convertCurrency({
                value: discountAmountCurrency + discountVatAmountCurrency,
                exchangeRate,
                decimals: 2,
              })
            ),
        }),

        exciseAmountCurrency: 0,
        exciseAmount: 0,
      };
    })
    // filter out items with price 0 because keez does not like them
    .filter((detail) => detail.originalNetAmount !== 0);

  if (stripeInvoice.discounts.length > 0) {
    stripeInvoice.discounts.forEach((d) => {
      const discount = d as Stripe.Discount;
      comments.push(`Discount: ${discount.coupon.name}`);
    });
  }

  const discountAmountCurrency =
    multiplier *
    (stripeInvoice.total_discount_amounts?.reduce(
      (acc, discount) => acc + discount.amount,
      0
    ) ?? 0);
  const discountVatAmountCurrency = (discountAmountCurrency * vatPercent) / 100;
  const hasDiscount = discountAmountCurrency !== 0;

  const netAmountCurrency =
    multiplier *
    (stripeInvoice.total_excluding_tax ?? throwError("Missing net amount"));
  const originalNetAmountCurrency =
    multiplier * (stripeInvoice.subtotal_excluding_tax ?? 0);
  const grossAmountCurrency = multiplier * (stripeInvoice.total ?? 0);
  const originalVatAmountCurrency =
    multiplier * originalNetAmountCurrency * (vatPercent / 100);

  // for romanian invoices, the reference currency HAS to be RON
  const currencyCode = isRomanianInvoice
    ? "RON"
    : stripeInvoice.currency.toUpperCase();
  const referenceCurrencyCode = stripeInvoice.currency.toUpperCase(); // must always be the same as the invoice currency

  const keezInvoice: KeezInvoice = {
    // externalId: stripeInvoice.id,
    series: isStorno ? "F2C" : series,
    number: isStorno ? undefined : parseInt(number),
    ...(isStorno && {
      storno: {
        series,
        number: parseInt(number),
        date: luxon.DateTime.fromSeconds(stripeInvoice.created).toFormat(
          "yyyyMMdd"
        ),
      },
    }),
    documentDate: luxon.DateTime.fromSeconds(stripeInvoice.created).toFormat(
      "yyyyMMdd"
    ),
    dueDate: luxon.DateTime.fromSeconds(
      stripeInvoice.due_date ?? stripeInvoice.created
    ).toFormat("yyyyMMdd"),
    vatOnCollection: false,
    currencyCode,
    referenceCurrencyCode,
    exchangeRate,
    paymentTypeId: 6, // stripe - https://app.keez.ro/help/api/data_payment_type.html
    partner,
    invoiceDetails,

    // Amounts
    netAmountCurrency: fromCents(netAmountCurrency),
    netAmount: fromCents(
      convertCurrency({
        value: netAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),
    originalNetAmountCurrency: fromCents(originalNetAmountCurrency),
    originalNetAmount: fromCents(
      convertCurrency({
        value: originalNetAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),

    grossAmountCurrency: fromCents(grossAmountCurrency),
    grossAmount: fromCents(
      convertCurrency({
        value: grossAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),

    // VAT
    vatAmountCurrency: fromCents(vatAmountCurrency),
    vatAmount: fromCents(
      convertCurrency({
        value: vatAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),
    originalVatAmountCurrency: fromCents(originalVatAmountCurrency),
    originalVatAmount: fromCents(
      convertCurrency({
        value: originalVatAmountCurrency,
        exchangeRate,
        decimals: 2,
      })
    ),

    // Discount
    ...(hasDiscount && {
      discountType: "Value",
      discountValueOnNet: true,

      discountNetValueCurrency: fromCents(discountAmountCurrency),
      discountNetValue: fromCents(
        convertCurrency({
          value: discountAmountCurrency,
          exchangeRate,
          decimals: 2,
        })
      ),
      discountVatValueCurrency: fromCents(discountVatAmountCurrency),
      discountVatValue: fromCents(
        convertCurrency({
          value: discountVatAmountCurrency,
          exchangeRate,
          decimals: 2,
        })
      ),

      discountGrossValueCurrency: fromCents(
        discountAmountCurrency + discountVatAmountCurrency
      ),
      discountGrossValue: fromCents(
        convertCurrency({
          value: discountAmountCurrency + discountVatAmountCurrency,
          exchangeRate,
          decimals: 2,
        })
      ),
    }),

    exciseAmountCurrency: 0,
    exciseAmount: 0,

    comments: comments.join("\n"),
  };

  const createdInvoice = await keez.createInvoice(keezInvoice);

  console.log(
    `Invoice ${createdInvoice.series}-${createdInvoice.number} uploaded to Keez`
  );
  return createdInvoice;
}

async function validateKeezInvoices({
  keez,
  keezInvoices,
}: {
  keez: KeezApi;
  keezInvoices: KeezInvoice[];
}) {
  console.log(`Validating ${keezInvoices.length} invoices in Keez ...`);
  for (const invoice of keezInvoices) {
    const invoiceId = invoice?.externalId ?? throwError("Missing ID");
    try {
      await keez.validateInvoice(invoiceId);
    } catch (error) {
      console.log(
        `Error validating invoice ${invoiceId}: ${getExceptionMessage(error)}`
      );
    }
  }
  console.log("All invoices validated in Keez");
}

function getInvoiceSeriesAndNumber(stripeInvoice: Stripe.Invoice) {
  const series = stripeInvoice.number?.split("-")[0];
  if (!series) {
    throw new Error(`Invoice ${stripeInvoice.id} does not have a series`);
  }
  const number = stripeInvoice.number?.split("-")[1];
  if (!number) {
    throw new Error(`Invoice ${stripeInvoice.id} does not have a number`);
  }

  return { series, number };
}

// Helper function to get exchange rates
type ExchangeRateMap = Record<
  string,
  Array<{
    currency: string;
    value: number;
  }>
>;
let exchangeRateMap: ExchangeRateMap | undefined;
async function getExchangeRateMap(): Promise<ExchangeRateMap> {
  if (exchangeRateMap) return exchangeRateMap;

  const currentYear = luxon.DateTime.now().year;
  const BNR_CURRENCY_EXHANGE_RATE_FEED_URL = `https://bnr.ro/files/xml/years/nbrfxrates${currentYear}.xml`;
  const result = await axios.get(BNR_CURRENCY_EXHANGE_RATE_FEED_URL);
  const xmlStr = result.data;

  const xml: {
    DataSet: {
      Body: {
        Cube: {
          $: {
            date: string;
          };
          Rate: {
            $: {
              currency: string;
            };
            _: string;
          }[];
        }[];
      }[];
    };
  } = await xml2js.parseStringPromise(xmlStr);

  const freshExchangeRateMap: ExchangeRateMap = {};
  xml.DataSet.Body[0].Cube.forEach((cube) => {
    if (cube.Rate) {
      const rates = cube.Rate.map((rate) => ({
        currency: rate.$.currency,
        value: parseFloat(rate._),
      }));
      freshExchangeRateMap[cube.$.date] = rates;
    }
  });

  exchangeRateMap = freshExchangeRateMap;
  return exchangeRateMap;
}
async function getExchangeRate({
  day,
  currency,
}: {
  day: string;
  currency: string;
}) {
  const exchangeRateMap = await getExchangeRateMap();
  const exchangeRates = exchangeRateMap[day];
  if (!exchangeRates) {
    throw new Error(`No exchange rates found for day ${day}`);
  }

  return (
    exchangeRates.find(
      (rate) => rate.currency.toLowerCase() === currency.toLowerCase()
    )?.value ?? throwError(`No exchange rate found for RON on day ${day}`)
  );
}

// helper function to convert a value from one currency to another
function convertCurrency({
  value,
  exchangeRate,
  decimals = 2,
}: {
  value: number;
  exchangeRate: number;
  decimals?: number;
}) {
  return _.round(value * exchangeRate, decimals);
}

// helper to transform a number from cents to dollars
function fromCents(cents: number) {
  return _.round(cents / 100, 2);
}

async function deleteInvoicesFromKeez({
  keez,
  keezInvoices,
}: {
  keez: KeezApi;
  keezInvoices: KeezInvoice[];
}) {
  console.log(`Deleting ${keezInvoices.length} invoices from Keez ...`);

  for (const invoice of keezInvoices) {
    const { series, number } = invoice;
    console.log(`Deleting invoice ${series}-${number}`);
    await keez.deleteInvoice(invoice?.externalId ?? throwError("Missing ID"));
  }
  console.log("All invoices deleted from Keez");
}

/**
 * Create reverse invoices for voided or refunded invoices.
 */
export async function createReverseInvoices({
  keez,
  stripe,
  stripeInvoices,
  keezTierToItemMap,
  stripePriceMap,
}: {
  keez: KeezApi;
  stripe: Stripe;
  stripeInvoices: Stripe.Invoice[];
  keezTierToItemMap: Map<string, KeezItem>;
  stripePriceMap: Map<string, Stripe.Price>;
}) {
  console.log("Creating reverse invoices ...");

  let invoicesToReverse: Stripe.Invoice[] = [];
  await promiseAllBatched(stripeInvoices, 10, async (invoice) => {
    const paymentIntentId = invoice.payments?.data[0]?.payment?.payment_intent;
    const paymentIntent =
      paymentIntentId === "string"
        ? await stripe.paymentIntents.retrieve(paymentIntentId)
        : undefined;

    const latestCharge =
      typeof paymentIntent?.latest_charge === "string"
        ? await stripe.charges.retrieve(paymentIntent.latest_charge)
        : undefined;
    const isRefunded = latestCharge?.refunded ?? false;
    const isPaid =
      invoice.status === "paid" &&
      invoice.status_transitions.paid_at !== null &&
      invoice.status_transitions.voided_at === null &&
      invoice.status_transitions.marked_uncollectible_at === null;

    if (!isPaid || isRefunded) {
      invoicesToReverse.push(invoice);
    }
  });
  invoicesToReverse = invoicesToReverse.sort(
    sortStripeInvoiceBySeriesAndNumberAsc
  );
  console.log(
    `Found ${invoicesToReverse.length} invoices to reverse out of ${stripeInvoices.length}`
  );

  const reverseKeezInvoices: KeezInvoice[] = [];
  const existingReverseKeezInvoices: KeezInvoice[] = [];
  for (const invoice of invoicesToReverse) {
    const { series, number } = getInvoiceSeriesAndNumber(invoice);

    // check if the invoice is already uploaded
    const existingInvoice = await keez.getReverseInvoice({
      series: "F2C",
      client: invoice.customer_name ?? throwError("Missing customer name"),
      documentDate: luxon.DateTime.fromSeconds(
        invoice.due_date ?? invoice.created
      ).toFormat("yyyyMMdd"),
      originalInvoiceSeries: series,
      originalInvoiceNumber: number,
    });
    if (existingInvoice) {
      console.log(`Invoice ${invoice.number} already reversed in Keez`);
      existingReverseKeezInvoices.push(existingInvoice);
      continue;
    }

    // create reverse invoice
    const reverseInvoice = await createKeezInvoiceFromStripeInvoice({
      keez,
      stripe,
      stripeInvoice: invoice,
      keezTierToItemMap,
      stripePriceMap,
      isStorno: true,
    });
    reverseKeezInvoices.push(reverseInvoice);
    console.log(`Created reverse invoice for ${series}-${number}`);
  }

  return { reverseKeezInvoices, existingReverseKeezInvoices };
}

function sortStripeInvoiceBySeriesAndNumberAsc(
  a: Stripe.Invoice,
  b: Stripe.Invoice
) {
  const aNumber = parseInt(getInvoiceSeriesAndNumber(a).number);
  const bNumber = parseInt(getInvoiceSeriesAndNumber(b).number);
  return aNumber - bNumber;
}

function sortKeezInvoiceBySeriesAndNumberDesc(a: KeezInvoice, b: KeezInvoice) {
  if (!a.number || !b.number) {
    return 0;
  }

  return b.number - a.number;
}

async function downloadInvoicePdf({
  keez,
  invoiceId,
  invoiceNumber,
}: {
  keez: KeezApi;
  invoiceId: string;
  invoiceNumber: string;
}) {
  const pdf = await keez.downloadInvoicePdf(invoiceId);

  // Ensure the folder exists
  const folderPath = "./invoices";
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  // Define the PDF path and write the file
  const filePath = path.join(folderPath, `${invoiceNumber}.pdf`);
  fs.writeFileSync(filePath, pdf, { encoding: "binary" });

  console.log(`Invoice ${invoiceNumber} saved to ${filePath}`);
}
