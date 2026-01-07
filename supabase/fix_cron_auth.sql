-- Fix pg_cron to include Authorization header
-- Run this in Supabase SQL Editor

-- First, delete the old job
SELECT cron.unschedule('scrape-isarna-job');

-- Create new job with Authorization header
SELECT cron.schedule(
  'scrape-isarna-job',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vgamlzaysvbxngbhgaao.supabase.co/functions/v1/scrape-isarna',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnYW1semF5c3ZieG5nYmhnYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzEzMDUsImV4cCI6MjA4MzM0NzMwNX0.mHWVEL4URQFgVxNKXxici9GRlbRMZF3eFpHpKTT5n84"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verify
SELECT * FROM cron.job WHERE jobname = 'scrape-isarna-job';
