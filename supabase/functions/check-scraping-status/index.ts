import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN") ?? "";

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

    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId");

    if (!jobId) {
      throw new Error("Job ID is required");
    }

    const { data: job, error: jobError } = await supabase
      .from("scraping_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError) throw jobError;

    if (!job.apify_run_id) {
      return new Response(
        JSON.stringify({
          status: job.status,
          message: "Job not yet started",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apifyResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${job.apify_run_id}?token=${APIFY_API_TOKEN}`
    );

    if (!apifyResponse.ok) {
      const errorBody = await apifyResponse.text();
      console.error("Apify API error details:", errorBody);
      throw new Error(`Apify API error: ${apifyResponse.statusText} - ${errorBody}`);
    }

    const apifyData = await apifyResponse.json();
    const runStatus = apifyData.data.status;

    if (runStatus === "SUCCEEDED" && job.status !== "completed") {
      const datasetId = apifyData.data.defaultDatasetId;
      const datasetResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
      );

      if (datasetResponse.ok) {
        const ads = await datasetResponse.json();

        if (ads.length > 0) {
          console.log('Sample ad data structure:', JSON.stringify(ads[0], null, 2));
        }

        const processedAds = ads.map((item: any) => {
          const hasCardsVideo = item.snapshot?.cards?.[0]?.video_hd_url;
          const hasSnapshotVideo = item.snapshot?.videos?.length > 0;
          const hasVideo = hasCardsVideo || hasSnapshotVideo;

          let videoUrl = null;
          let thumbnail = '';

          if (hasCardsVideo) {
            videoUrl = item.snapshot.cards[0].video_hd_url || item.snapshot.cards[0].video_sd_url;
            thumbnail = item.snapshot.cards[0].video_preview_image_url || '';
          } else if (hasSnapshotVideo) {
            videoUrl = item.snapshot.videos[0].video_hd_url || item.snapshot.videos[0].video_sd_url;
            thumbnail = item.snapshot.videos[0].video_preview_image_url || '';
          }

          const imageUrl = item.snapshot?.images?.[0]?.original_image_url ||
                           item.snapshot?.cards?.[0]?.original_image_url ||
                           thumbnail || '';

          const bodyText = item.snapshot?.body?.text || '';
          const extractedHashtags = bodyText.match(/#\w+/g) || [];

          const activeHours = Math.round((item.total_active_time || 0) / 3600);
          const variants = item.collation_count || 1;
          const platformCount = item.publisher_platform?.length || 1;
          const isVerified = item.advertiser?.ad_library_page_info?.page_info?.page_verification === 'BLUE_VERIFIED';

          let score = 0;
          const days = activeHours / 24;
          score += Math.min(40, days * 5);
          score += Math.min(30, variants * 6);
          score += Math.min(20, platformCount * 4);
          if (isVerified) score += 10;

          const advertiserName = item.snapshot?.page_name ||
                                 item.page_name ||
                                 item.advertiser?.page_name ||
                                 item.advertiser?.name ||
                                 item.advertiser?.ad_library_page_info?.page_info?.page_name ||
                                 'Unknown Advertiser';

          return {
            ad_id: item.ad_archive_id || `${Date.now()}-${Math.random()}`,
            platform: job.platform,
            type: hasVideo ? 'video' : 'image',
            url: item.ad_library_url || `https://www.facebook.com/ads/library/?id=${item.ad_archive_id}`,
            download_url: videoUrl || imageUrl,
            thumbnail: hasVideo ? thumbnail : imageUrl,
            advertiser_name: advertiserName,
            ad_copy: bodyText,
            title: item.snapshot?.title || '',
            cta_text: item.snapshot?.cta_text || 'Shop now',
            landing_url: item.snapshot?.link_url || '',
            active_status: item.is_active ? 'Active' : 'Inactive',
            active_hours: activeHours,
            variants: variants,
            platforms_used: (item.publisher_platform || []).join(', '),
            page_likes: item.snapshot?.page_like_count || 0,
            verified: isVerified ? 'Yes' : 'No',
            performance_score: Math.round(score),
            est_reach: item.aaa_info?.eu_total_reach ? `EU: ${item.aaa_info.eu_total_reach}k` : 'No data',
            ad_format: item.snapshot?.display_format || 'UNKNOWN',
            hashtags: extractedHashtags.join(', '),
            raw_data: item,
            scraped_at: new Date().toISOString()
          };
        });

        processedAds.sort((a: any, b: any) => b.performance_score - a.performance_score);

        for (const ad of processedAds) {
          await supabase.from("scraped_ads").insert(ad);
        }

        const topAd = processedAds[0];
        const stats = {
          totalAds: processedAds.length,
          activeAds: processedAds.filter((ad: any) => ad.active_status === 'Active').length,
          averageActiveHours: processedAds.length > 0
            ? Math.round(processedAds.reduce((sum: number, ad: any) => sum + ad.active_hours, 0) / processedAds.length)
            : 0,
          videoCount: processedAds.filter((ad: any) => ad.type === 'video').length,
          imageCount: processedAds.filter((ad: any) => ad.type === 'image').length,
          averageVariants: processedAds.length > 0
            ? (processedAds.reduce((sum: number, ad: any) => sum + ad.variants, 0) / processedAds.length).toFixed(1)
            : 0,
          topPerformer: {
            id: topAd?.ad_id,
            title: topAd?.title,
            score: topAd?.performance_score,
            activeHours: topAd?.active_hours,
            variants: topAd?.variants
          }
        };

        await supabase
          .from("scraping_jobs")
          .update({
            status: "completed",
            total_ads_found: ads.length,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);

        return new Response(
          JSON.stringify({
            status: "completed",
            totalAdsFound: ads.length,
            stats: stats,
            message: "Scraping completed successfully",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } else if (runStatus === "FAILED") {
      await supabase
        .from("scraping_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      return new Response(
        JSON.stringify({
          status: "failed",
          message: "Scraping failed",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: runStatus.toLowerCase(),
        message: `Scraping is ${runStatus.toLowerCase()}`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in check-scraping-status:", error);
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