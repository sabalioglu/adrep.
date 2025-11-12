/*
  # Add Deep Analysis Field

  1. Changes
    - Add `deep_analysis` JSONB column to `scraped_ads` table to store frame-by-frame video analysis
    - Add `deep_analyzed_at` timestamp column to track when deep analysis was performed

  2. Details
    - The `deep_analysis` field will store:
      - Video concept and replication strategy
      - Frame-by-frame breakdown with timestamps
      - Detailed replication prompts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'deep_analysis'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN deep_analysis JSONB;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'deep_analyzed_at'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN deep_analyzed_at TIMESTAMPTZ;
  END IF;
END $$;