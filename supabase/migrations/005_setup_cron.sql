-- Enable pg_cron and pg_net extensions for scheduled tasks
-- Note: These need to be enabled in Supabase Dashboard > Database > Extensions

-- This migration documents the cron setup
-- Actual cron jobs should be created in the Supabase dashboard or via SQL Editor

/*
To set up the scraper cron job, run this in the Supabase SQL Editor:

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule scraper to run every 15 minutes
SELECT cron.schedule(
  'scrape-isarna-official',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/scrape-isarna',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule expired report cleanup to run daily at 3am
SELECT cron.schedule(
  'cleanup-expired-reports',
  '0 3 * * *',
  $$SELECT cleanup_expired_reports()$$
);

-- To view scheduled jobs:
SELECT * FROM cron.job;

-- To unschedule a job:
SELECT cron.unschedule('scrape-isarna-official');

*/

-- Create a table to log scrape results
CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  lakes_updated INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scrape_logs_created_idx ON scrape_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS scrape_logs_status_idx ON scrape_logs(status);

-- Enable RLS
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access logs
CREATE POLICY "Service role can manage scrape logs" ON scrape_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Public can read recent logs (for transparency)
CREATE POLICY "Public can view recent scrape logs" ON scrape_logs
  FOR SELECT USING (created_at > NOW() - INTERVAL '7 days');

COMMENT ON TABLE scrape_logs IS 'Audit log for scraper runs to monitor data ingestion health';

