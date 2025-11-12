import { Router } from 'express';
import db from '../models/database';

export const analyzeAdRouter = Router();

// Mock AI analysis generator
function generateMockAnalysis(ad: any) {
  const visualAnalysis = `This ${ad.type} ad features a clean, modern design with high-quality visuals. The color scheme is eye-catching and aligns well with the brand identity of ${ad.advertiser_name}. The composition draws the viewer's attention to the key product features.`;

  const copyAnalysis = `The ad copy is concise and persuasive, using power words to create urgency. It effectively communicates the value proposition and includes a clear call-to-action. The tone is ${ad.type === 'video' ? 'dynamic and engaging' : 'professional yet approachable'}.`;

  const toneStyle = `The overall tone is ${ad.verified === 'Yes' ? 'authoritative and trustworthy' : 'friendly and relatable'}, designed to resonate with the target demographic. The style combines informative content with emotional appeal.`;

  const targetAudience = `Based on the creative and messaging, this ad targets ${ad.page_likes > 500000 ? 'a broad mainstream audience' : 'a niche, engaged community'} interested in ${ad.hashtags ? ad.hashtags.split(',')[0].replace('#', '') : 'lifestyle products'}. Age range likely 25-45, ${ad.platform === 'tiktok' ? 'skewing younger' : 'diverse age demographics'}.`;

  return {
    visualAnalysis,
    copyAnalysis,
    toneStyle,
    targetAudience,
    imagePrompt: `Create a ${ad.type} ad featuring ${ad.advertiser_name} products with a modern, clean aesthetic. Include vibrant colors, professional lighting, and focus on product benefits. Style: commercial photography, high-end branding.`,
    copyVariations: [
      {
        headline: `Transform Your Life with ${ad.advertiser_name}`,
        body: `Discover why millions trust ${ad.advertiser_name} for quality and innovation. Limited time offer - act now!`,
        cta: ad.cta_text || 'Shop Now',
        style: 'Urgent and benefit-focused'
      },
      {
        headline: `${ad.advertiser_name}: Innovation Meets Excellence`,
        body: `Experience the difference with our award-winning products. Join our community of satisfied customers today.`,
        cta: 'Learn More',
        style: 'Professional and aspirational'
      },
      {
        headline: `Why Choose ${ad.advertiser_name}?`,
        body: `Quality guaranteed. Customer satisfaction is our priority. See what makes us different.`,
        cta: 'Get Started',
        style: 'Question-based and reassuring'
      }
    ]
  };
}

analyzeAdRouter.post('/', async (req, res) => {
  try {
    const { adId } = req.body;

    if (!adId) {
      return res.status(400).json({
        success: false,
        error: 'adId is required'
      });
    }

    // Get ad from database
    const ad = db.prepare('SELECT * FROM scraped_ads WHERE id = ?').get(adId) as any;

    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Ad not found'
      });
    }

    // Generate mock analysis
    const analysis = generateMockAnalysis(ad);

    // Create AI prompts object
    const aiPrompts = {
      imageGenerationPrompt: analysis.imagePrompt,
      visualAnalysis: analysis.visualAnalysis,
      copyAnalysis: analysis.copyAnalysis,
      toneAndStyle: analysis.toneStyle,
      targetAudience: analysis.targetAudience,
      copyVariations: JSON.stringify(analysis.copyVariations)
    };

    // Update ad with analysis
    const updateAd = db.prepare(`
      UPDATE scraped_ads 
      SET ai_prompts = ?, analyzed_at = ?, analyzed = 1
      WHERE id = ?
    `);

    updateAd.run(JSON.stringify(aiPrompts), new Date().toISOString(), adId);

    res.json({
      success: true,
      analysis: aiPrompts,
      message: 'Ad analyzed successfully'
    });
  } catch (error: any) {
    console.error('Error in analyze-ad:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
