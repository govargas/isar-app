-- Change scraper from every 3 minutes to hourly (backup only)
-- The main refresh will be on-demand via UI button

-- Remove the aggressive 3-minute job
SELECT cron.unschedule('scrape-isarna-job');

-- Create hourly backup job (runs at minute 0 of each hour)
SELECT cron.schedule(
  'scrape-isarna-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vgamlzaysvbxngbhgaao.supabase.co/functions/v1/scrape-isarna',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnYW1semF5c3ZieG5nYmhnYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzEzMDUsImV4cCI6MjA4MzM0NzMwNX0.mHWVEL4URQFgVxNKXxici9GRlbRMZF3eFpHpKTT5n84"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verify
SELECT * FROM cron.job;


