/*
  # Add analyzed flag to scraped_ads

  1. Changes
    - Add `analyzed` boolean column to track which ads have been analyzed
    - Default to false for existing and new ads
  
  2. Purpose
    - Distinguish between scraped ads (Scraping Page - all ads)
    - And analyzed ads (Analysis Page - only ads that were analyzed)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_ads' AND column_name = 'analyzed'
  ) THEN
    ALTER TABLE scraped_ads ADD COLUMN analyzed boolean DEFAULT false;
  END IF;
END $$;
