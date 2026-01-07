-- User-generated community reports
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lake_id UUID NOT NULL REFERENCES lakes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('safe', 'uncertain', 'warning', 'no_ice')),
  surface_condition TEXT CHECK (surface_condition IN ('smooth', 'rough', 'snow_covered', 'plogad', 'unknown')),
  comment TEXT CHECK (char_length(comment) <= 500),
  location GEOMETRY(POINT, 4326), -- Exact location of report if provided
  photo_url TEXT,
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS user_reports_lake_idx ON user_reports(lake_id);
CREATE INDEX IF NOT EXISTS user_reports_user_idx ON user_reports(user_id);
CREATE INDEX IF NOT EXISTS user_reports_location_idx ON user_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS user_reports_expires_idx ON user_reports(expires_at);
CREATE INDEX IF NOT EXISTS user_reports_reported_idx ON user_reports(reported_at DESC);

-- Enable Row Level Security
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Public read access for non-expired reports
CREATE POLICY "User reports are viewable by everyone" ON user_reports
  FOR SELECT USING (true);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports" ON user_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update own reports" ON user_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports" ON user_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE user_reports;

-- Function to clean up very old reports (> 30 days) to prevent table bloat
-- Expired reports are kept visible but greyed out in the UI
CREATE OR REPLACE FUNCTION cleanup_old_reports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Only delete reports older than 30 days
  DELETE FROM user_reports WHERE reported_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a report is expired (for use in views/queries)
CREATE OR REPLACE FUNCTION is_report_expired(report_expires_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN report_expires_at < NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON TABLE user_reports IS 'Community-submitted ice condition reports. Reports older than 24 hours are shown greyed out but remain visible for historical reference.';
COMMENT ON COLUMN user_reports.expires_at IS 'After this time, reports are shown greyed out but not deleted. Indicates the report may be outdated.';

