import * as dotenv from "dotenv";
import { Stripe } from "stripe";
import * as luxon from "luxon";
import * as _ from "lodash";

import { KeezApi } from "./keez/keezApi";
import { parseEnv } from "./env";

import { uploadInvoicesToKeez } from "./keez/invoiceManagement";

dotenv.config();

const env = parseEnv();

async function fetchAndDownloadInvoices({ stripe }: { stripe: Stripe }) {
  let allInvoices: Stripe.Invoice[] = [];
  let hasMore = true;
  let lastInvoiceId: string | undefined = undefined;

  const to = luxon.DateTime.now()
    .setZone("Europe/Bucharest")
    .minus({ months: 1 })
    .endOf("month");
  const from = to.startOf("month");
  while (hasMore) {
    const invoices: Stripe.ApiList<Stripe.Invoice> = await stripe.invoices.list(
      {
        created: {
          gte: Math.floor(from.toJSDate().getTime() / 1000), // Start of last month
          lte: Math.floor(to.toJSDate().getTime() / 1000), // End of last month
        },
        limit: 100, // Stripe's max per page
        ...(lastInvoiceId && { starting_after: lastInvoiceId }),
        expand: ["data.discounts", "data.payments"],
      }
    );

    // Check if there's more data to paginate
    hasMore = invoices.has_more;
    if (hasMore) {
      lastInvoiceId = invoices.data[invoices.data.length - 1].id;
    }

    allInvoices = allInvoices.concat(invoices.data);
  }

  return allInvoices;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  // await sleep(5000);
  // Start the invoice fetching and downloading process
  const stripe = new Stripe(env.stripeApiKey);
  const stripeInvoices = await fetchAndDownloadInvoices({
    stripe,
  });
  console.log(`Fetched ${stripeInvoices.length} invoices`);

  // write invoices to json file
  // fs.writeFileSync("invoices.json", JSON.stringify(stripeInvoices, null, 2));

  // Upload invoices to Keez
  const keez = new KeezApi(env.keez);
  await uploadInvoicesToKeez({
    keez,
    stripe,
    stripeInvoices,
  });
}

run()
  .then(() => console.log("Done"))
  .catch(console.error);
