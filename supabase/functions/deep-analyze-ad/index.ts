import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('[DEEP-ANALYZE] Starting deep analysis...');
    const body = await req.json();
    const { adId } = body;
    console.log('[DEEP-ANALYZE] Ad ID:', adId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    const fetchResponse = await fetch(
      `${supabaseUrl}/rest/v1/scraped_ads?id=eq.${adId}&select=*`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );

    const ads = await fetchResponse.json();
    const ad = ads[0];

    if (!ad || ad.type !== 'video') {
      return new Response(
        JSON.stringify({ success: false, error: 'Video ad not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const prompt = `You are an expert video marketing analyst. Analyze this video ad in EXTREME DETAIL by examining the actual text content provided.

==== AD INFORMATION ====
ADVERTISER: ${ad.advertiser_name || 'Unknown'}
PLATFORM: ${ad.platform}

TITLE/HEADLINE:
${cleanTitle || 'Not provided'}

CAPTION/AD COPY:
${cleanAdCopy || 'Not provided'}

CALL-TO-ACTION (CTA):
${cleanCtaText || 'Not provided'}

PERFORMANCE SCORE: ${ad.performance_score || 'Not available'}
==========================

CRITICAL: You MUST analyze the ACTUAL text provided above. Do NOT say "Not provided" or "N/A" in your analysis. If text is provided, analyze it deeply. If truly not provided, explain what's missing and what should be there.

Return ONLY valid JSON (no markdown code blocks, no backticks):
{
  "concept": "Write a comprehensive 500+ word analysis covering: overall video concept, storytelling approach, emotional arc, pacing strategy, key message delivery, target audience appeal, unique selling points, and why this approach works for this product/service. Be specific and detailed.",

  "captionAnalysis": "Provide deep analysis of the ACTUAL caption text shown above. Analyze: (1) Opening hook and attention-grabbing techniques, (2) Key benefits and features highlighted, (3) Urgency and scarcity tactics used, (4) Emotional triggers and psychological persuasion, (5) Use of hashtags and social proof, (6) Tone and voice (casual, authoritative, excited, etc), (7) How it complements the video visuals, (8) Call-outs to specific offers or guarantees. Quote specific phrases from the caption. If caption is truly not provided, explain what would make an effective caption.",

  "titleAnalysis": "Analyze the ACTUAL title/headline shown above. Examine: (1) Attention-grabbing elements (numbers, symbols, urgency), (2) Curiosity gaps created, (3) Benefit promises made, (4) Use of discounts/offers/codes, (5) Strategic positioning and framing, (6) Emotional appeal, (7) Length and readability. Quote key parts of the title. If title not provided, explain what makes an effective title.",

  "ctaAnalysis": "Analyze the ACTUAL CTA shown above. Evaluate: (1) Action clarity and simplicity, (2) Urgency level and time sensitivity, (3) Value proposition communicated, (4) Friction reduction techniques, (5) Psychological triggers used (FOMO, exclusivity, guarantee), (6) Placement strategy in customer journey, (7) How it ties to the offer in title/caption. Quote the exact CTA. If CTA not provided, recommend what the CTA should be.",

  "frames": [
    {"timestamp": "0:00-0:03", "description": "Extremely detailed description of what's happening visually, any text overlays or graphics, camera movement, transitions, lighting setup, color palette, and the strategic purpose of this opening segment. What emotion does it create? Why does it hook viewers?"},
    {"timestamp": "0:03-0:06", "description": "Continue with same level of detail..."},
    {"timestamp": "0:06-0:09", "description": "Continue..."}
  ],

  "replicationPrompts": "Write an ultra-detailed 1000+ word replication guide covering: \n\nPRE-PRODUCTION:\n- Complete shot list with specific frame descriptions\n- Equipment requirements (camera specs, lenses, stabilization, lighting gear, audio equipment)\n- Location scouting needs and setup requirements\n- Props list with specific items needed\n- Casting requirements (demographics, characteristics, skills needed)\n- Wardrobe and styling directions\n- Script breakdown and storyboard notes\n\nPRODUCTION:\n- Detailed shooting script with timing marks\n- Camera angles and movements for each shot\n- Lighting setup for each scene (key, fill, back lights)\n- Audio recording approach (dialogue, ambient, music)\n- B-roll requirements and capture plan\n- Direction notes for talent/subjects\n\nPOST-PRODUCTION:\n- Editing sequence and pacing notes\n- Transition styles between scenes\n- Visual effects and motion graphics needed\n- Color grading palette and mood\n- Text overlay timing and animation\n- Music selection criteria and placement\n- Sound design and mixing notes\n- Export settings for optimal quality\n\nPLATFORM OPTIMIZATION:\n- Aspect ratio considerations (16:9, 9:16, 1:1)\n- Optimal duration for platform\n- Thumbnail creation strategy\n- Caption hook timing (first 3 seconds)\n- CTA placement and timing\n- Hashtag strategy\n\nALTERNATIVE VARIATIONS:\n- 3 different creative approaches to test\n- Multiple hook variations for A/B testing\n- CTA variations to optimize conversion\n- Different music/tone options"
}

REQUIREMENTS:
- Break down the video into 8-12 time-stamped segments in the "frames" array
- Be extremely specific and actionable in every section
- Reference the actual text content provided (title, caption, CTA) in your analysis
- Make the replication guide detailed enough that someone could recreate this ad from scratch`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const geminiData = await geminiResponse.json();
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error('No response from AI');
    }

    // Remove markdown code blocks if present
    console.log('[AI] Raw response length:', aiText.length);
    let cleanedText = aiText.trim();

    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      console.log('[AI] Found markdown code block, extracting JSON');
      cleanedText = codeBlockMatch[1].trim();
    }

    // Find the first { and last } to extract pure JSON
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      console.log('[AI] Extracted JSON boundaries');
    }

    console.log('[AI] Parsing JSON...');
    let deepAnalysis;
    try {
      deepAnalysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[AI] JSON parse failed, attempting with responseFormat');
      // Try again with Gemini's JSON mode
      const retryResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          })
        }
      );
      const retryData = await retryResponse.json();
      const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!retryText) throw new Error('Retry failed: No response from AI');
      deepAnalysis = JSON.parse(retryText);
    }

    console.log('[AI] Successfully parsed, frames:', deepAnalysis.frames?.length);

    await fetch(
      `${supabaseUrl}/rest/v1/scraped_ads?id=eq.${adId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          deep_analysis: deepAnalysis,
          deep_analyzed_at: new Date().toISOString()
        })
      }
    );

    return new Response(
      JSON.stringify({ success: true, data: { framesAnalyzed: deepAnalysis.frames?.length || 0 } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ERROR] Deep analysis failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERROR] Error message:', errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});