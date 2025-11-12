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
    const body = await req.json();
    const {
      salesPointUrl,
      brandName,
      productDescription,
      keyBenefit,
      targetAudience,
      ageRange,
      category,
      productImage,
      sourceAdAnalysis,
    } = body;

    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    let strategyContext = '';
    if (sourceAdAnalysis) {
      strategyContext = `
REPLICATE THESE SUCCESSFUL STRATEGIES:

Title Strategy:
${sourceAdAnalysis.titleAnalysis || 'Not available'}

Caption Strategy:
${sourceAdAnalysis.captionAnalysis || 'Not available'}

CTA Strategy:
${sourceAdAnalysis.ctaAnalysis || 'Not available'}

Overall Concept:
${sourceAdAnalysis.concept || 'Not available'}
`;
    }

    const prompt = `You are an expert ad copywriter and marketing strategist. Create a high-converting ad for this product.

PRODUCT INFORMATION:
- Brand: ${brandName}
- Product: ${productDescription}
- Key Benefit: ${keyBenefit}
- Sales URL: ${salesPointUrl}
- Target Audience: ${targetAudience}, ${ageRange} years old
- Category: ${category}

${strategyContext}

CRITICAL INSTRUCTIONS:
1. Use the strategy context above as inspiration but adapt it for THIS specific product
2. Make the ad feel natural and authentic, not templated
3. Focus on emotional triggers and benefits, not just features
4. Create urgency and desire
5. The caption should tell a story or create intrigue

Return ONLY valid JSON with this structure:
{
  "title": "Attention-grabbing headline (include discount/offer if relevant, max 60 chars)",
  "caption": "Compelling 3-4 paragraph caption that hooks attention, builds desire, and drives action. Include emojis strategically. Tell a story or create intrigue. End with clear benefit and urgency.",
  "cta": "Clear, action-driven CTA button text (2-4 words, e.g., 'Shop Now' or 'Get 40% Off')",
  "hashtags": "10-15 relevant hashtags separated by spaces",
  "visualDirection": "Detailed description of what the product image/video should show: lighting, angles, props, colors, mood, setting. Be specific for video/photo creators."
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
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

    let generatedAd;
    try {
      generatedAd = JSON.parse(aiText);
    } catch (parseError) {
      const firstBrace = aiText.indexOf('{');
      const lastBrace = aiText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const cleaned = aiText.substring(firstBrace, lastBrace + 1);
        generatedAd = JSON.parse(cleaned);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    return new Response(
      JSON.stringify({ success: true, ad: generatedAd }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating custom ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});