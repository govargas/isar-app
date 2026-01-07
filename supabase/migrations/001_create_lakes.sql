-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Lakes table (static reference data for Stockholm area lakes)
CREATE TABLE IF NOT EXISTS lakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  region TEXT, -- e.g., 'Stockholm', 'Mälaren', 'Norrtälje'
  geometry GEOMETRY(POLYGON, 4326) NOT NULL,
  centroid GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (ST_Centroid(geometry)) STORED,
  area_km2 DECIMAL(10, 2),
  typical_freeze_date DATE, -- Historical average first freeze
  max_depth_m DECIMAL(6, 2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial indexes for fast geo queries
CREATE INDEX IF NOT EXISTS lakes_geometry_idx ON lakes USING GIST (geometry);
CREATE INDEX IF NOT EXISTS lakes_centroid_idx ON lakes USING GIST (centroid);
CREATE INDEX IF NOT EXISTS lakes_slug_idx ON lakes (slug);
CREATE INDEX IF NOT EXISTS lakes_region_idx ON lakes (region);

-- Enable Row Level Security
ALTER TABLE lakes ENABLE ROW LEVEL SECURITY;

-- Public read access for lakes
CREATE POLICY "Lakes are viewable by everyone" ON lakes
  FOR SELECT USING (true);

-- Only service role can modify lakes
CREATE POLICY "Service role can manage lakes" ON lakes
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lakes_updated_at
  BEFORE UPDATE ON lakes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE lakes IS 'Reference data for lakes in the Stockholm area for ice skating';
COMMENT ON COLUMN lakes.geometry IS 'Lake boundary as a polygon in WGS84 coordinates';
COMMENT ON COLUMN lakes.typical_freeze_date IS 'Historical average date of first safe ice formation';

