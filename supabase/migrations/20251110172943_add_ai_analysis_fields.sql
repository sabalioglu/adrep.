/*
  # Add AI Analysis Fields

  1. Changes to `scraped_ads` Table
    - Add `ai_visual_analysis` (text) - AI-generated visual analysis
    - Add `ai_prompts` (jsonb) - Generated marketing prompts
    - Add `analyzed_at` (timestamptz) - Timestamp of analysis

  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'ai_visual_analysis'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN ai_visual_analysis text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'ai_prompts'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN ai_prompts jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'analyzed_at'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN analyzed_at timestamptz;
  END IF;
END $$;

-- Add index on analyzed_at for filtering analyzed ads
CREATE INDEX IF NOT EXISTS idx_scraped_ads_analyzed_at ON scraped_ads(analyzed_at DESC);
