import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { adsRouter } from './routes/ads';
import { scrapeAdsRouter } from './routes/scrape-ads';
import { analyzeAdRouter } from './routes/analyze-ad';
import { deepAnalyzeAdRouter } from './routes/deep-analyze-ad';
import { generateCustomAdRouter } from './routes/generate-custom-ad';
import { generateVideoRouter } from './routes/generate-video';
import { checkScrapingStatusRouter } from './routes/check-scraping-status';
import { checkVideoStatusRouter } from './routes/check-video-status';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ad Intelligence API is running' });
});

// Routes - matching Supabase functions structure
app.use('/api/ads', adsRouter);
app.use('/functions/v1/scrape-ads', scrapeAdsRouter);
app.use('/functions/v1/analyze-ad', analyzeAdRouter);
app.use('/functions/v1/deep-analyze-ad', deepAnalyzeAdRouter);
app.use('/functions/v1/generate-custom-ad', generateCustomAdRouter);
app.use('/functions/v1/generate-video-sora', generateVideoRouter);
app.use('/functions/v1/check-scraping-status', checkScrapingStatusRouter);
app.use('/functions/v1/check-video-status', checkVideoStatusRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/functions/v1`);
});
