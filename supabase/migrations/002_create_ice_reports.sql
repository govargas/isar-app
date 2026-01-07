-- Ice reports table (official data from scraper)
CREATE TABLE IF NOT EXISTS ice_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lake_id UUID NOT NULL REFERENCES lakes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('safe', 'uncertain', 'warning', 'no_ice')),
  source TEXT NOT NULL DEFAULT 'official' CHECK (source IN ('official', 'forecast', 'satellite')),
  ice_thickness_cm INTEGER CHECK (ice_thickness_cm >= 0 AND ice_thickness_cm <= 200),
  surface_condition TEXT CHECK (surface_condition IN ('smooth', 'rough', 'snow_covered', 'plogad', 'unknown')),
  temperature_avg DECIMAL(4, 1), -- Average temperature in Celsius
  wind_speed_avg DECIMAL(4, 1), -- Average wind speed in m/s
  raw_text TEXT, -- Original scraped text for reference
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS ice_reports_lake_idx ON ice_reports(lake_id);
CREATE INDEX IF NOT EXISTS ice_reports_status_idx ON ice_reports(status);
CREATE INDEX IF NOT EXISTS ice_reports_source_idx ON ice_reports(source);
CREATE INDEX IF NOT EXISTS ice_reports_scraped_idx ON ice_reports(scraped_at DESC);
CREATE INDEX IF NOT EXISTS ice_reports_valid_idx ON ice_reports(valid_from, valid_until);

-- Unique constraint to prevent duplicate reports
CREATE UNIQUE INDEX IF NOT EXISTS ice_reports_unique_idx 
  ON ice_reports(lake_id, source, scraped_at);

-- Enable Row Level Security
ALTER TABLE ice_reports ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Ice reports are viewable by everyone" ON ice_reports
  FOR SELECT USING (true);

-- Only service role can insert/update (from scrapers)
CREATE POLICY "Service role can manage ice reports" ON ice_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE ice_reports;

COMMENT ON TABLE ice_reports IS 'Official ice condition reports from scraped sources';
COMMENT ON COLUMN ice_reports.status IS 'Ice safety status: safe (plogad), uncertain, warning, or no_ice';
COMMENT ON COLUMN ice_reports.source IS 'Data source: official (municipality), forecast (weather model), satellite';

