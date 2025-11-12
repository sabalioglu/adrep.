import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';

export const scrapeAdsRouter = Router();

// Mock ad data generator
function generateMockAd(platform: 'facebook' | 'tiktok', query: string, index: number): any {
  const advertisers = ['Nike', 'Adidas', 'Apple', 'Samsung', 'Coca-Cola', 'Amazon', 'Tesla', 'Netflix'];
  const ctaTexts = ['Shop Now', 'Learn More', 'Sign Up', 'Download', 'Get Started', 'Buy Now'];
  const types = ['image', 'video'];
  
  const advertiser = advertisers[index % advertisers.length];
  const type = types[index % types.length];
  const id = uuidv4();
  
  return {
    id,
    platform,
    ad_id: `${platform}_${Date.now()}_${index}`,
    advertiser_name: advertiser,
    ad_creative_url: `https://picsum.photos/seed/${id}/800/600`,
    ad_copy: `${query} - Discover our amazing products! Limited time offer. Don't miss out on this incredible opportunity to transform your life.`,
    cta_text: ctaTexts[index % ctaTexts.length],
    raw_data: JSON.stringify({
      snapshot: {
        cards: [{
          title: `${advertiser} ${query}`,
          body: `Amazing ${query} deals from ${advertiser}`
        }]
      }
    }),
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    type,
    url: `https://www.${platform}.com/ads/${id}`,
    download_url: type === 'video' ? `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4` : null,
    thumbnail: `https://picsum.photos/seed/${id}/400/300`,
    title: `${advertiser} - ${query}`,
    landing_url: `https://www.${advertiser.toLowerCase()}.com`,
    active_status: index % 3 === 0 ? 'Active' : 'Inactive',
    active_hours: Math.floor(Math.random() * 720) + 24,
    variants: Math.floor(Math.random() * 5) + 1,
    platforms_used: platform === 'facebook' ? 'Facebook, Instagram' : 'TikTok',
    page_likes: Math.floor(Math.random() * 1000000) + 10000,
    verified: index % 2 === 0 ? 'Yes' : 'No',
    performance_score: Math.floor(Math.random() * 100) + 1,
    est_reach: `${Math.floor(Math.random() * 500)}K - ${Math.floor(Math.random() * 1000) + 500}K`,
    ad_format: type === 'video' ? 'Video Ad' : 'Image Ad',
    hashtags: `#${query}, #${advertiser}, #shopping, #deals`,
    analyzed: 0
  };
}

scrapeAdsRouter.post('/', async (req, res) => {
  try {
    const { platform, searchQuery, maxAds = 10 } = req.body;

    if (!platform || !searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Platform and searchQuery are required'
      });
    }

    // Create scraping job
    const jobId = uuidv4();
    const runId = `mock_run_${Date.now()}`;

    const insertJob = db.prepare(`
      INSERT INTO scraping_jobs (id, apify_run_id, platform, search_query, status, started_at)
      VALUES (?, ?, ?, ?, 'running', ?)
    `);

    insertJob.run(jobId, runId, platform, searchQuery, new Date().toISOString());

    // Generate mock ads
    setTimeout(() => {
      const adsCount = Math.min(maxAds, 15);
      const insertAd = db.prepare(`
        INSERT INTO scraped_ads (
          id, platform, ad_id, advertiser_name, ad_creative_url, ad_copy, cta_text,
          raw_data, scraped_at, created_at, type, url, download_url, thumbnail,
          title, landing_url, active_status, active_hours, variants, platforms_used,
          page_likes, verified, performance_score, est_reach, ad_format, hashtags, analyzed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < adsCount; i++) {
        const ad = generateMockAd(platform, searchQuery, i);
        insertAd.run(
          ad.id, ad.platform, ad.ad_id, ad.advertiser_name, ad.ad_creative_url,
          ad.ad_copy, ad.cta_text, ad.raw_data, ad.scraped_at, ad.created_at,
          ad.type, ad.url, ad.download_url, ad.thumbnail, ad.title, ad.landing_url,
          ad.active_status, ad.active_hours, ad.variants, ad.platforms_used,
          ad.page_likes, ad.verified, ad.performance_score, ad.est_reach,
          ad.ad_format, ad.hashtags, ad.analyzed
        );
      }

      // Update job as completed
      const updateJob = db.prepare(`
        UPDATE scraping_jobs 
        SET status = 'completed', total_ads_found = ?, completed_at = ?
        WHERE id = ?
      `);
      updateJob.run(adsCount, new Date().toISOString(), jobId);
    }, 2000);

    res.json({
      success: true,
      jobId,
      runId,
      message: 'Scraping job started'
    });
  } catch (error: any) {
    console.error('Error in scrape-ads:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
