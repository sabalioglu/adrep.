import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  adId: string;
}

Deno.serve(async (req: Request) => {
  console.log('\n========================================')
  console.log('ANALYZE-AD FUNCTION CALLED');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('========================================');

  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[REQ] Reading request body...');
    const body = await req.json();
    const { adId } = body as AnalyzeRequest;
    console.log('[REQ] Ad ID:', adId);

    if (!adId) {
      console.error('[REQ] No adId provided');
      return new Response(
        JSON.stringify({ success: false, error: 'adId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[DB] Fetching ad from Supabase...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiKey) {
      console.error('[CONFIG] GEMINI_API_KEY not found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI service not configured. Please add GEMINI_API_KEY to your environment variables.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch ad using REST API directly
    const fetchResponse = await fetch(
      `${supabaseUrl}/rest/v1/scraped_ads?id=eq.${adId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch ad: ${fetchResponse.statusText}`);
    }

    const ads = await fetchResponse.json();
    const ad = ads[0];

    if (!ad) {
      console.error('[DB] Ad not found:', adId);
      return new Response(
        JSON.stringify({ success: false, error: 'Ad not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[DB] Ad found:', {
      id: ad.id,
      advertiser: ad.advertiser_name,
      type: ad.type,
    });

    function replacePlaceholders(text: string): string {
      if (!text) return text;

      let result = text;

      if (ad.raw_data?.snapshot?.cards?.[0]) {
        const card = ad.raw_data.snapshot.cards[0];
        if (card.title) {
          result = result.replace(/\{\{product\.name\}\}/g, card.title);
        }
        if (card.body) {
          result = result.replace(/\{\{product\.brand\}\}/g, card.body);
        }
      }

      if (ad.advertiser_name && ad.advertiser_name !== 'Unknown Advertiser') {
        result = result.replace(/\{\{product\.brand\}\}/g, ad.advertiser_name);
      }

      if (ad.title) {
        result = result.replace(/\{\{product\.name\}\}/g, ad.title);
      }

      result = result.replace(/\{\{[^}]+\}\}/g, '');

      return result;
    }

    const cleanTitle = replacePlaceholders(ad.title || '');
    const cleanAdCopy = replacePlaceholders(ad.ad_copy || '');
    const cleanCtaText = replacePlaceholders(ad.cta_text || '');

    const isVideo = ad.type === 'video';

    // Build comprehensive prompt for Gemini
    const analysisPrompt = `You are an expert marketing analyst. Analyze this ${ad.platform} ad and generate comprehensive marketing prompts.

AD DETAILS:
- Advertiser: ${ad.advertiser_name || 'Unknown'}
- Platform: ${ad.platform}
- Type: ${ad.type || 'image'}
- Title: ${cleanTitle || 'N/A'}
- Ad Copy: ${cleanAdCopy || 'N/A'}
- CTA: ${cleanCtaText || 'N/A'}
- Active Hours: ${ad.active_hours || 0}
- Variants: ${ad.variants || 1}
- Performance Score: ${ad.performance_score || 'N/A'}
- Page Likes: ${ad.page_likes || 'N/A'}
- Landing URL: ${ad.landing_url || 'N/A'}
- Hashtags: ${ad.hashtags || 'N/A'}

Your task is to generate 5 detailed marketing prompts in JSON format. Return ONLY valid JSON with these exact keys (no markdown code blocks):

{
  "campaignStrategy": "A comprehensive 300+ word campaign strategy including objectives, target audience, content calendar outline, A/B testing approach, budget allocation suggestions, and KPI framework",
  "contentVariations": "Create 5 detailed ad copy variations with different angles (emotional, logical, urgency, benefit-focused, social-proof). For each: headline, body copy (50+ words), CTA, and visual direction",
  "audienceTargeting": "Detailed 200+ word audience targeting strategy including demographics, psychographics, interests, behavioral triggers, lookalike audience strategies, and platform-specific targeting recommendations",
  "${isVideo ? 'videoRecreation' : 'imageRecreation'}": "Complete ${isVideo ? 'video' : 'image'} recreation brief (300+ words) including ${isVideo ? 'shot list, storyboard, script, music/sound requirements, editing timeline, b-roll suggestions' : 'design layout, visual hierarchy, typography specifications, color palette with hex codes, asset requirements, composition details'}",
  "designBrief": "Comprehensive design brief (250+ words) covering brand voice, visual style guide, color psychology, typography choices, layout principles, white space usage, and platform-specific design requirements"
}

Be specific, actionable, and detailed. Base recommendations on the actual ad data provided. Return ONLY the JSON object, no other text.`;

    console.log('[AI] Calling Gemini API...');
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: analysisPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[AI] Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('[AI] Gemini response received');

    // Extract text from Gemini response
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      console.error('[AI] No text in Gemini response:', JSON.stringify(geminiData));
      throw new Error('No text content in Gemini response');
    }

    console.log('[AI] Response length:', aiText.length, 'characters');

    // Parse JSON from AI response
    let prompts;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, aiText];
      const jsonText = jsonMatch[1] || aiText;
      prompts = JSON.parse(jsonText.trim());
      console.log('[AI] Successfully parsed prompts:', Object.keys(prompts));
    } catch (parseError) {
      console.error('[AI] Failed to parse JSON:', parseError);
      console.error('[AI] AI Response:', aiText.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('[DB] Updating database with results...');
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/scraped_ads?id=eq.${adId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          ai_visual_analysis: aiText.substring(0, 500),
          ai_prompts: prompts,
          analyzed_at: new Date().toISOString(),
          analyzed: true,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('[DB] Update error:', errorText);
      throw new Error(`Failed to update ad: ${updateResponse.status}`);
    }

    console.log('[SUCCESS] Analysis complete!');
    console.log('========================================\n');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Analysis completed',
        data: {
          hasVisualAnalysis: true,
          promptsCount: Object.keys(prompts).length,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('ERROR IN FUNCTION');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('[ERROR] Type:', error?.constructor?.name);
    console.error('[ERROR] Message:', error instanceof Error ? error.message : String(error));
    console.error('[ERROR] Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n');

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: error?.constructor?.name || 'Unknown',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});