import * as dotenv from "dotenv";
import axios from "axios";
import { Stripe } from "stripe";
import * as luxon from "luxon";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";

import { KeezApi } from "./keez/keezApi";
import { parseEnv } from "./env";

import { uploadInvoicesToKeez } from "./keez/invoiceManagement";

dotenv.config();

const env = parseEnv();

async function downloadInvoicePdf({
  invoiceUrl,
  invoiceNumber,
  isPaid,
}: {
  invoiceUrl: string;
  invoiceNumber: string;
  isPaid: boolean;
}) {
  const response = await axios({
    url: invoiceUrl,
    method: "GET",
    responseType: "stream", // Download the PDF as a stream
  });

  // Ensure the folder exists
  const folderPath = "./invoices";
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  // Define the PDF path and write the file
  const filePath = path.join(folderPath, `${invoiceNumber}.pdf`);
  const writer = fs.createWriteStream(filePath);

  // Stream the PDF to the file system
  response.data.pipe(writer);

  const downloadPromise = new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });

  await downloadPromise;
  console.log(`Invoice ${invoiceNumber} saved to ${filePath}`);

  if (!isPaid) {
    console.log(`Invoice ${invoiceNumber} is unpaid`);
    // copy pdf to unpaid folder
    const unpaidFolderPath = "./invoices/unpaid";
    if (!fs.existsSync(unpaidFolderPath)) {
      fs.mkdirSync(unpaidFolderPath);
    }

    const unpaidFilePath = path.join(unpaidFolderPath, `${invoiceNumber}.pdf`);
    fs.copyFileSync(filePath, unpaidFilePath);
  }
}

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
      }
    );

    // for (const invoice of invoices.data) {
    //   if (invoice.invoice_pdf) {
    //     const invoiceNumber = invoice.number || invoice.id;
    //     console.log(`Downloading invoice: ${invoiceNumber}`);
    //     await downloadInvoicePdf({
    //       invoiceUrl: invoice.invoice_pdf,
    //       invoiceNumber,
    //       isPaid: invoice.paid,
    //     });
    //   } else {
    //     console.error(`Invoice ${invoice.id} does not have a PDF`);
    //   }
    // }

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
