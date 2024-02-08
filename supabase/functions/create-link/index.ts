import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS } from "../_shared/cors.ts";
import { DbSchema } from "../_shared/types.ts";
import { parseJobPage } from "../_shared/jobParser.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { cleanJobUrl } from "../_shared/jobParser.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { title, url, html } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const supabaseClient = createClient<DbSchema>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // list all job sites from db
    const { data, error: selectError } = await supabaseClient
      .from("sites")
      .select("*");
    if (selectError) throw new Error(selectError.message);
    const allJobSites = data ?? [];

    // insert a new link in the db
    const { cleanUrl, site } = cleanJobUrl({ url, allJobSites });
    const { data: createdLinks, error } = await supabaseClient
      .from("links")
      .insert({
        url: cleanUrl,
        title,
        site_id: site.id,
      })
      .select("*");
    if (error) throw error;

    // parse the html and save found jobs in the db
    // need to save it to be able to diff the jobs list later
    const jobs = await parseJobPage({ allJobSites, url: cleanUrl, html });
    console.log(`found ${jobs.length} jobs`);
    const { error: insertError } = await supabaseClient.from("jobs").upsert(
      jobs.map((j) => ({ ...j, status: "new" as const })),
      { onConflict: "externalId", ignoreDuplicates: true }
    );
    if (insertError) throw insertError;

    const [link] = createdLinks ?? [];
    return new Response(JSON.stringify({ link }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    console.error(getExceptionMessage(error));
    return new Response(
      JSON.stringify({ errorMessage: getExceptionMessage(error, true) }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        status: 500,
      }
    );
  }
});
