import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN") ?? "";
const APIFY_ACTOR_ID = Deno.env.get("APIFY_ACTOR_ID") ?? "";

interface ScrapeRequest {
  platform: string;
  searchQuery?: string;
  pageUrl?: string;
  maxResults?: number;
  country?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { platform, searchQuery, pageUrl, maxResults = 50, country = "US" }: ScrapeRequest = await req.json();

    // Determine which URL to use
    let facebookAdLibraryUrl: string;
    let searchQueryText: string;

    if (pageUrl) {
      // User provided a direct page URL
      facebookAdLibraryUrl = pageUrl;
      searchQueryText = pageUrl;
    } else if (searchQuery) {
      // Build Facebook Ad Library search URL from keyword
      const encodedQuery = encodeURIComponent(searchQuery);
      facebookAdLibraryUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodedQuery}&search_type=keyword_unordered&media_type=all`;
      searchQueryText = searchQuery;
    } else {
      throw new Error("Either searchQuery or pageUrl must be provided");
    }

    // Create a scraping job record
    const { data: job, error: jobError } = await supabase
      .from("scraping_jobs")
      .insert({
        platform,
        search_query: searchQueryText,
        status: "pending",
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Start Apify actor run with correct input format matching n8n config
    const actorInput = {
      count: maxResults,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: [],
        apifyProxyCountry: country
      },
      scrapeAdDetails: true,
      "scrapePageAds.activeStatus": "all",
      "scrapePageAds.countryCode": "ALL",
      urls: [
        {
          url: facebookAdLibraryUrl
        }
      ]
    };

    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(actorInput),
      }
    );

    if (!apifyResponse.ok) {
      const errorBody = await apifyResponse.text();
      console.error("Apify API error details:", errorBody);
      throw new Error(`Apify API error: ${apifyResponse.statusText} - ${errorBody}`);
    }

    const apifyData = await apifyResponse.json();
    const runId = apifyData.data.id;

    // Update job with Apify run ID and status
    await supabase
      .from("scraping_jobs")
      .update({
        apify_run_id: runId,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        apifyRunId: runId,
        message: "Scraping job started. Use the job ID to check status.",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in scrape-ads:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});