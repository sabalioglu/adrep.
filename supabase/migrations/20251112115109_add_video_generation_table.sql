/*
  # Video Generation Tasks Table

  1. New Tables
    - `video_generation_tasks`
      - `id` (uuid, primary key)
      - `task_id` (text, unique) - Kie.ai task ID
      - `user_prompt` (text) - The prompt for video generation
      - `image_url` (text) - URL of the image used
      - `aspect_ratio` (text) - portrait or landscape
      - `n_frames` (text) - 10 or 15
      - `state` (text) - waiting, success, fail
      - `result_url` (text) - Generated video URL
      - `fail_message` (text) - Error message if failed
      - `cost_time` (integer) - Generation time in ms
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `related_ad_id` (uuid) - Optional link to scraped_ads

  2. Security
    - Enable RLS on `video_generation_tasks` table
    - Add policy for public read access (no auth required for this demo)
*/

CREATE TABLE IF NOT EXISTS video_generation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text UNIQUE,
  user_prompt text NOT NULL,
  image_url text NOT NULL,
  aspect_ratio text DEFAULT 'landscape',
  n_frames text DEFAULT '10',
  state text DEFAULT 'waiting',
  result_url text,
  fail_message text,
  cost_time integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  related_ad_id uuid REFERENCES scraped_ads(id) ON DELETE SET NULL
);

ALTER TABLE video_generation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to video tasks"
  ON video_generation_tasks
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert for video tasks"
  ON video_generation_tasks
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update for video tasks"
  ON video_generation_tasks
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);