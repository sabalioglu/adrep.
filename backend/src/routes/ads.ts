import { Router } from 'express';
import db from '../models/database';

export const adsRouter = Router();

// Get all ads
adsRouter.get('/', async (req, res) => {
  try {
    const { analyzed } = req.query;
    
    let query = 'SELECT * FROM scraped_ads ORDER BY scraped_at DESC';
    let params: any[] = [];
    
    if (analyzed === 'true') {
      query = 'SELECT * FROM scraped_ads WHERE analyzed = 1 ORDER BY scraped_at DESC';
    }
    
    const ads = db.prepare(query).all(...params);
    
    // Parse JSON fields
    const parsedAds = ads.map((ad: any) => ({
      ...ad,
      raw_data: ad.raw_data ? JSON.parse(ad.raw_data) : null,
      ai_prompts: ad.ai_prompts ? JSON.parse(ad.ai_prompts) : null,
      deep_analysis: ad.deep_analysis ? JSON.parse(ad.deep_analysis) : null,
      analyzed: Boolean(ad.analyzed)
    }));
    
    res.json(parsedAds);
  } catch (error: any) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single ad
adsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ad = db.prepare('SELECT * FROM scraped_ads WHERE id = ?').get(id) as any;
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Ad not found'
      });
    }
    
    // Parse JSON fields
    const parsedAd = {
      ...ad,
      raw_data: ad.raw_data ? JSON.parse(ad.raw_data) : null,
      ai_prompts: ad.ai_prompts ? JSON.parse(ad.ai_prompts) : null,
      deep_analysis: ad.deep_analysis ? JSON.parse(ad.deep_analysis) : null,
      analyzed: Boolean(ad.analyzed)
    };
    
    res.json(parsedAd);
  } catch (error: any) {
    console.error('Error fetching ad:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
