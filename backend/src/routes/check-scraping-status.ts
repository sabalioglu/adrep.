import { Router } from 'express';
import db from '../models/database';

export const checkScrapingStatusRouter = Router();

checkScrapingStatusRouter.get('/', async (req, res) => {
  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'jobId is required'
      });
    }

    // Get job from database
    const job = db.prepare('SELECT * FROM scraping_jobs WHERE id = ?').get(jobId as string) as any;

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Get ads for this job
    const ads = db.prepare(`
      SELECT * FROM scraped_ads 
      WHERE scraped_at >= ? 
      ORDER BY created_at DESC
    `).all(job.started_at);

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        platform: job.platform,
        searchQuery: job.search_query,
        totalAdsFound: job.total_ads_found,
        startedAt: job.started_at,
        completedAt: job.completed_at
      },
      ads: ads
    });
  } catch (error: any) {
    console.error('Error in check-scraping-status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
