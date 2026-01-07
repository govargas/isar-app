-- ================================================
-- SCHEDULE SCRAPER WITH PG_CRON + PG_NET
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. First, you need to store your service_role key in Vault
-- Go to: Supabase Dashboard > Project Settings > API > service_role key
-- Copy that key (starts with eyJ...)

-- 3. Store the key in Supabase Vault (run this separately first!)
-- Replace YOUR_SERVICE_ROLE_KEY with your actual key
/*
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_SERVICE_ROLE_KEY',
  'service_role_key',
  'Service role key for Edge Function invocation'
);
*/

-- 4. Create a function to invoke the scraper
CREATE OR REPLACE FUNCTION invoke_scraper()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key text;
BEGIN
  -- Get service role key from vault (or use direct key if vault not set up)
  -- For now, we'll use the anon key approach which works for public functions
  
  PERFORM net.http_post(
    url := 'https://vgamlzaysvbxngbhgaao.supabase.co/functions/v1/scrape-isarna'::text,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  
  RAISE NOTICE 'Scraper invoked at %', NOW();
END;
$$;

-- 5. Remove existing job if it exists
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'scrape-isarna-job';

-- 6. Schedule the scraper to run every 3 minutes
SELECT cron.schedule(
  'scrape-isarna-job',           -- Job name
  '*/3 * * * *',                 -- Every 3 minutes
  'SELECT invoke_scraper();'     -- Function to call
);

-- 7. Verify the job was created
SELECT jobid, jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'scrape-isarna-job';

-- ================================================
-- USEFUL COMMANDS:
-- 
-- Check job history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Check if jobs are running:
-- SELECT * FROM cron.job;
--
-- Disable the job:
-- SELECT cron.unschedule('scrape-isarna-job');
--
-- Change frequency to every 5 minutes:
-- SELECT cron.unschedule('scrape-isarna-job');
-- SELECT cron.schedule('scrape-isarna-job', '*/5 * * * *', 'SELECT invoke_scraper();');
-- ================================================

