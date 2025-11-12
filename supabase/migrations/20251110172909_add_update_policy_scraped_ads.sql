/*
  # Add UPDATE policy for scraped_ads

  1. Changes
    - Add policy to allow public UPDATE on scraped_ads table
    - This allows edge functions to update analysis results
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scraped_ads' 
    AND policyname = 'Public can update scraped ads'
  ) THEN
    CREATE POLICY "Public can update scraped ads"
      ON scraped_ads
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
