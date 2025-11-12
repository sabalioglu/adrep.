import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(path.join(__dirname, '../../data/app.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS scraped_ads (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    ad_id TEXT NOT NULL,
    advertiser_name TEXT,
    ad_creative_url TEXT,
    ad_copy TEXT,
    cta_text TEXT,
    raw_data TEXT,
    scraped_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    type TEXT,
    url TEXT,
    download_url TEXT,
    thumbnail TEXT,
    title TEXT,
    landing_url TEXT,
    active_status TEXT,
    active_hours INTEGER,
    variants INTEGER,
    platforms_used TEXT,
    page_likes INTEGER,
    verified TEXT,
    performance_score INTEGER,
    est_reach TEXT,
    ad_format TEXT,
    hashtags TEXT,
    ai_visual_analysis TEXT,
    ai_prompts TEXT,
    analyzed_at TEXT,
    deep_analysis TEXT,
    deep_analyzed_at TEXT,
    media_url TEXT,
    analyzed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS scraping_jobs (
    id TEXT PRIMARY KEY,
    apify_run_id TEXT,
    platform TEXT NOT NULL,
    search_query TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    total_ads_found INTEGER DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS video_generation_tasks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    prompt TEXT,
    image_url TEXT,
    aspect_ratio TEXT,
    state TEXT DEFAULT 'waiting',
    result_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
