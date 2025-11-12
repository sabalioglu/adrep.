/*
  # Add Ad Insights Fields

  1. Changes to `scraped_ads` Table
    - Add `type` (text) - 'video' or 'image'
    - Add `url` (text) - direct link to ad
    - Add `download_url` (text) - download URL for media
    - Add `thumbnail` (text) - thumbnail URL
    - Add `title` (text) - ad title
    - Add `landing_url` (text) - landing page URL
    - Add `active_status` (text) - 'Active' or 'Inactive'
    - Add `active_hours` (int) - hours ad has been active
    - Add `variants` (int) - number of ad variants
    - Add `platforms_used` (text) - platforms where ad runs
    - Add `page_likes` (int) - advertiser page likes
    - Add `verified` (text) - 'Yes' or 'No'
    - Add `performance_score` (int) - calculated performance score
    - Add `est_reach` (text) - estimated reach
    - Add `ad_format` (text) - ad format type
    - Add `hashtags` (text) - extracted hashtags

  2. Security
    - No changes to RLS policies needed
*/

-- Add new columns to scraped_ads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'type'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'url'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'download_url'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN download_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'thumbnail'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN thumbnail text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'title'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'landing_url'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN landing_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'active_status'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN active_status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'active_hours'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN active_hours int DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'variants'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN variants int DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'platforms_used'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN platforms_used text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'page_likes'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN page_likes int DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'verified'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN verified text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'performance_score'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN performance_score int DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'est_reach'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN est_reach text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'ad_format'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN ad_format text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN hashtags text;
  END IF;
END $$;

-- Add index on performance_score for sorting
CREATE INDEX IF NOT EXISTS idx_scraped_ads_performance_score ON scraped_ads(performance_score DESC);