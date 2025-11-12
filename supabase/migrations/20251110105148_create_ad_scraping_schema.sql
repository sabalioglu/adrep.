/*
  # Ad Scraping and Analysis Schema

  1. New Tables
    - `scraped_ads`
      - `id` (uuid, primary key)
      - `platform` (text) - 'facebook' or 'tiktok'
      - `ad_id` (text) - unique identifier from platform
      - `advertiser_name` (text)
      - `ad_creative_url` (text) - image/video URL
      - `ad_copy` (text) - ad headline and body text
      - `cta_text` (text) - call to action
      - `raw_data` (jsonb) - full response from Apify
      - `scraped_at` (timestamptz)
      - `created_at` (timestamptz)

    - `ad_analyses`
      - `id` (uuid, primary key)
      - `ad_id` (uuid, foreign key to scraped_ads)
      - `visual_analysis` (text) - analysis of visual elements
      - `copy_analysis` (text) - analysis of ad copy
      - `tone_and_style` (text) - detected tone/style
      - `target_audience` (text) - inferred audience
      - `key_elements` (jsonb) - structured key elements
      - `analyzed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `generated_prompts`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, foreign key to ad_analyses)
      - `image_generation_prompt` (text) - prompt for image generation
      - `ad_copy_variations` (jsonb) - array of copy variations
      - `style_guide` (text) - style instructions
      - `generated_at` (timestamptz)
      - `created_at` (timestamptz)

    - `scraping_jobs`
      - `id` (uuid, primary key)
      - `apify_run_id` (text) - Apify actor run ID
      - `platform` (text)
      - `search_query` (text)
      - `status` (text) - 'pending', 'running', 'completed', 'failed'
      - `total_ads_found` (int)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since no auth required for this tool)

  3. Indexes
    - Add indexes for common queries
*/

-- Create scraped_ads table
CREATE TABLE IF NOT EXISTS scraped_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('facebook', 'tiktok')),
  ad_id text NOT NULL,
  advertiser_name text,
  ad_creative_url text,
  ad_copy text,
  cta_text text,
  raw_data jsonb,
  scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(platform, ad_id)
);

-- Create ad_analyses table
CREATE TABLE IF NOT EXISTS ad_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES scraped_ads(id) ON DELETE CASCADE,
  visual_analysis text,
  copy_analysis text,
  tone_and_style text,
  target_audience text,
  key_elements jsonb DEFAULT '{}',
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create generated_prompts table
CREATE TABLE IF NOT EXISTS generated_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES ad_analyses(id) ON DELETE CASCADE,
  image_generation_prompt text NOT NULL,
  ad_copy_variations jsonb DEFAULT '[]',
  style_guide text,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create scraping_jobs table
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apify_run_id text,
  platform text NOT NULL CHECK (platform IN ('facebook', 'tiktok')),
  search_query text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_ads_found int DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scraped_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Public can view scraped ads"
  ON scraped_ads FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert scraped ads"
  ON scraped_ads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view ad analyses"
  ON ad_analyses FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert ad analyses"
  ON ad_analyses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view generated prompts"
  ON generated_prompts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert generated prompts"
  ON generated_prompts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view scraping jobs"
  ON scraping_jobs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert scraping jobs"
  ON scraping_jobs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update scraping jobs"
  ON scraping_jobs FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scraped_ads_platform ON scraped_ads(platform);
CREATE INDEX IF NOT EXISTS idx_scraped_ads_scraped_at ON scraped_ads(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_analyses_ad_id ON ad_analyses(ad_id);
CREATE INDEX IF NOT EXISTS idx_generated_prompts_analysis_id ON generated_prompts(analysis_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);