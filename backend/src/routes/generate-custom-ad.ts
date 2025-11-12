import { Router } from 'express';

export const generateCustomAdRouter = Router();

generateCustomAdRouter.post('/', async (req, res) => {
  try {
    const {
      salesPointUrl,
      brandName,
      productDescription,
      keyBenefit,
      targetAudience,
      ageRange,
      category,
      sourceAdAnalysis
    } = req.body;

    if (!brandName || !productDescription || !keyBenefit) {
      return res.status(400).json({
        success: false,
        error: 'Brand name, product description, and key benefit are required'
      });
    }

    // Generate custom ad based on inputs
    const generatedAd = {
      title: `${keyBenefit} | ${brandName} ${category}`,
      
      caption: `✨ Discover ${brandName}'s ${category.toLowerCase()} designed for ${targetAudience.toLowerCase()}.

${productDescription}

🎯 Key Benefit: ${keyBenefit}

Perfect for ages ${ageRange}. ${sourceAdAnalysis ? 'Created using proven strategies from top-performing ads.' : ''}

👉 ${salesPointUrl}

#${brandName.replace(/\s+/g, '')} #${category.replace(/\s+/g, '')} #${keyBenefit.replace(/\s+/g, '')} #Shopping #Deals`,

      cta: 'Shop Now',

      hashtags: `#${brandName.replace(/\s+/g, '')} #${category.replace(/\s+/g, '')} #${keyBenefit.replace(/\s+/g, '')} #Quality #MustHave #${targetAudience}`,

      visualDirection: `Visual Concept for ${brandName} Ad:

PRIMARY SHOT:
- Feature the product prominently in center frame
- Clean, professional background (white or ${category.includes('Beauty') ? 'soft pastels' : category.includes('Tech') ? 'modern gradient' : 'lifestyle setting'})
- Excellent lighting to highlight product quality
- ${targetAudience === 'Women' ? 'Feminine, elegant aesthetic' : 'Bold, confident styling'}

COMPOSITION:
- Hero product shot with ${keyBenefit} highlighted
- Include lifestyle context showing product in use
- Add subtle brand elements (logo, colors)
- Ensure mobile-friendly vertical format (9:16)

COLOR PALETTE:
- ${category.includes('Beauty') ? 'Soft pinks, creams, golds' : category.includes('Tech') ? 'Blues, blacks, silvers' : category.includes('Health') ? 'Greens, whites, naturals' : 'Vibrant, energetic colors'}
- Maintain brand consistency
- High contrast for text overlays

TEXT OVERLAYS:
- "${keyBenefit}" as main headline
- Brand name: "${brandName}"
- Price/offer callout (if applicable)
- Use clean, modern sans-serif fonts

STYLE REFERENCES:
- ${sourceAdAnalysis ? 'Inspired by successful competitor strategies' : 'Modern commercial photography'}
- Professional yet approachable
- Target demographic: ${targetAudience}, ages ${ageRange}
- Platform: Instagram/Facebook/TikTok optimized

ADDITIONAL ELEMENTS:
- Consider adding customer testimonial quotes
- Include trust badges if applicable
- Ensure CTA button/text is prominent
- Mobile-first design approach`
    };

    res.json({
      success: true,
      ad: generatedAd,
      message: 'Custom ad generated successfully'
    });
  } catch (error: any) {
    console.error('Error in generate-custom-ad:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
