-- ================================================
-- ISAR DATABASE SETUP - Run this in Supabase SQL Editor
-- ================================================

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- 2. LAKES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS lakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  region TEXT,
  geometry GEOMETRY(POLYGON, 4326) NOT NULL,
  centroid GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (ST_Centroid(geometry)) STORED,
  area_km2 DECIMAL(10, 2),
  typical_freeze_date DATE,
  max_depth_m DECIMAL(6, 2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lakes_geometry_idx ON lakes USING GIST (geometry);
CREATE INDEX IF NOT EXISTS lakes_centroid_idx ON lakes USING GIST (centroid);
CREATE INDEX IF NOT EXISTS lakes_slug_idx ON lakes (slug);
CREATE INDEX IF NOT EXISTS lakes_region_idx ON lakes (region);

ALTER TABLE lakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lakes are viewable by everyone" ON lakes
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage lakes" ON lakes
  FOR ALL USING (auth.role() = 'service_role');

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

-- ==========================================
-- 3. ICE REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS ice_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lake_id UUID NOT NULL REFERENCES lakes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('safe', 'uncertain', 'warning', 'no_ice')),
  source TEXT NOT NULL DEFAULT 'official' CHECK (source IN ('official', 'forecast', 'satellite')),
  ice_thickness_cm INTEGER CHECK (ice_thickness_cm >= 0 AND ice_thickness_cm <= 200),
  surface_condition TEXT CHECK (surface_condition IN ('smooth', 'rough', 'snow_covered', 'plogad', 'unknown')),
  temperature_avg DECIMAL(4, 1),
  wind_speed_avg DECIMAL(4, 1),
  raw_text TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ice_reports_lake_idx ON ice_reports(lake_id);
CREATE INDEX IF NOT EXISTS ice_reports_status_idx ON ice_reports(status);
CREATE INDEX IF NOT EXISTS ice_reports_source_idx ON ice_reports(source);
CREATE INDEX IF NOT EXISTS ice_reports_scraped_idx ON ice_reports(scraped_at DESC);

ALTER TABLE ice_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ice reports are viewable by everyone" ON ice_reports
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage ice reports" ON ice_reports
  FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 4. USER REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lake_id UUID NOT NULL REFERENCES lakes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('safe', 'uncertain', 'warning', 'no_ice')),
  surface_condition TEXT CHECK (surface_condition IN ('smooth', 'rough', 'snow_covered', 'plogad', 'unknown')),
  comment TEXT CHECK (char_length(comment) <= 500),
  location GEOMETRY(POINT, 4326),
  photo_url TEXT,
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_reports_lake_idx ON user_reports(lake_id);
CREATE INDEX IF NOT EXISTS user_reports_user_idx ON user_reports(user_id);
CREATE INDEX IF NOT EXISTS user_reports_location_idx ON user_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS user_reports_expires_idx ON user_reports(expires_at);
CREATE INDEX IF NOT EXISTS user_reports_reported_idx ON user_reports(reported_at DESC);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reports are viewable by everyone" ON user_reports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON user_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON user_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON user_reports
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 5. VIEWS
-- ==========================================
CREATE OR REPLACE VIEW lake_current_status AS
SELECT DISTINCT ON (l.id)
  l.id,
  l.name,
  l.slug,
  l.region,
  l.geometry,
  l.centroid,
  l.area_km2,
  l.typical_freeze_date,
  l.description,
  l.created_at,
  ir.status,
  ir.ice_thickness_cm,
  ir.surface_condition,
  ir.temperature_avg,
  ir.wind_speed_avg,
  ir.scraped_at as last_updated,
  ir.raw_text as last_report_text,
  (
    SELECT COUNT(*)::INTEGER 
    FROM user_reports ur 
    WHERE ur.lake_id = l.id AND ur.expires_at > NOW()
  ) as recent_report_count,
  (
    SELECT COUNT(*)::INTEGER 
    FROM user_reports ur 
    WHERE ur.lake_id = l.id AND ur.reported_at > NOW() - INTERVAL '30 days'
  ) as total_report_count
FROM lakes l
LEFT JOIN ice_reports ir ON l.id = ir.lake_id
ORDER BY l.id, ir.scraped_at DESC NULLS LAST;

CREATE OR REPLACE VIEW all_user_reports AS
SELECT 
  ur.*,
  l.name as lake_name,
  l.slug as lake_slug,
  ur.expires_at < NOW() as is_expired
FROM user_reports ur
JOIN lakes l ON ur.lake_id = l.id
WHERE ur.reported_at > NOW() - INTERVAL '30 days'
ORDER BY ur.reported_at DESC;

-- ==========================================
-- 6. HELPER FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION get_nearby_lakes(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  region TEXT,
  status TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lcs.id,
    lcs.name,
    lcs.slug,
    lcs.region,
    lcs.status,
    ST_Distance(
      lcs.centroid::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000 as distance_km
  FROM lake_current_status lcs
  WHERE ST_DWithin(
    lcs.centroid::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION cleanup_old_reports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_reports WHERE reported_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. ENABLE REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE ice_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE user_reports;

-- ================================================
-- SEED DATA - Real Stockholm Area Lakes
-- ================================================

-- Insert real Stockholm area lakes with actual coordinates
INSERT INTO lakes (name, slug, region, geometry, area_km2, description) VALUES

-- Brunnsviken - Popular skating spot in central Stockholm
('Brunnsviken', 'brunnsviken', 'Stockholm', 
  ST_GeomFromText('POLYGON((18.0264 59.3619, 18.0282 59.3680, 18.0355 59.3719, 18.0453 59.3714, 18.0510 59.3668, 18.0486 59.3601, 18.0401 59.3568, 18.0319 59.3578, 18.0264 59.3619))', 4326),
  1.9, 'Classic Stockholm skating lake between Haga and the university. Often well-maintained tracks.'),

-- Trekanten - Small lake in Liljeholmen
('Trekanten', 'trekanten', 'Stockholm',
  ST_GeomFromText('POLYGON((18.0089 59.3078, 18.0112 59.3102, 18.0164 59.3098, 18.0171 59.3068, 18.0138 59.3050, 18.0089 59.3078))', 4326),
  0.12, 'Small triangular lake in Liljeholmen. Popular for beginners and families.'),

-- Flaten - Large lake in Tyresö
('Flaten', 'flaten', 'Tyresö',
  ST_GeomFromText('POLYGON((18.2201 59.2358, 18.2287 59.2412, 18.2398 59.2403, 18.2456 59.2341, 18.2411 59.2279, 18.2301 59.2267, 18.2201 59.2358))', 4326),
  0.64, 'Beautiful nature reserve lake. Often has good natural ice conditions.'),

-- Magelungen - Lake between Farsta and Bandhagen  
('Magelungen', 'magelungen', 'Farsta',
  ST_GeomFromText('POLYGON((18.0712 59.2498, 18.0789 59.2578, 18.0912 59.2589, 18.1023 59.2534, 18.0989 59.2456, 18.0856 59.2423, 18.0712 59.2498))', 4326),
  2.8, 'Large lake in southern Stockholm. Popular for long-distance skating when conditions allow.'),

-- Drevviken - Long lake stretching into Haninge
('Drevviken', 'drevviken', 'Haninge',
  ST_GeomFromText('POLYGON((18.1234 59.2156, 18.1345 59.2234, 18.1512 59.2198, 18.1623 59.2112, 18.1567 59.2034, 18.1401 59.2012, 18.1289 59.2078, 18.1234 59.2156))', 4326),
  5.6, 'Long lake stretching from Älta to Haninge. Great for touring when safe.'),

-- Orlången - Lake in Huddinge
('Orlången', 'orlangen', 'Huddinge',
  ST_GeomFromText('POLYGON((17.9823 59.2301, 17.9912 59.2378, 18.0034 59.2389, 18.0112 59.2334, 18.0078 59.2256, 17.9956 59.2223, 17.9823 59.2301))', 4326),
  1.2, 'Nature reserve lake in Huddinge with varied terrain.'),

-- Ältasjön - Lake in Nacka
('Ältasjön', 'altasjon', 'Nacka',
  ST_GeomFromText('POLYGON((18.1734 59.2601, 18.1823 59.2656, 18.1912 59.2634, 18.1956 59.2578, 18.1901 59.2523, 18.1789 59.2534, 18.1734 59.2601))', 4326),
  0.45, 'Scenic lake in Nacka municipality. Part of the Nacka nature reserve.'),

-- Norrviken - Lake in Sollentuna
('Norrviken', 'norrviken', 'Sollentuna',
  ST_GeomFromText('POLYGON((17.9412 59.4301, 17.9523 59.4378, 17.9678 59.4389, 17.9789 59.4323, 17.9734 59.4245, 17.9589 59.4212, 17.9467 59.4234, 17.9412 59.4301))', 4326),
  2.1, 'Popular skating lake north of Stockholm. Well-organized skating tracks in winter.'),

-- Välsjön - Lake in Järfälla  
('Välsjön', 'valsjon', 'Järfälla',
  ST_GeomFromText('POLYGON((17.8234 59.4012, 17.8312 59.4078, 17.8423 59.4067, 17.8489 59.4012, 17.8445 59.3956, 17.8334 59.3934, 17.8267 59.3967, 17.8234 59.4012))', 4326),
  0.38, 'Small lake in Järfälla nature reserve.'),

-- Mälaren - Ekerö section
('Mälaren - Ekeröviken', 'malaren-ekeroviken', 'Ekerö',
  ST_GeomFromText('POLYGON((17.7823 59.2801, 17.7956 59.2878, 17.8134 59.2867, 17.8234 59.2789, 17.8178 59.2701, 17.8012 59.2678, 17.7889 59.2723, 17.7823 59.2801))', 4326),
  8.5, 'Bay of Lake Mälaren near Ekerö. Excellent for long-distance skating on good years.'),

-- Bornsjön - Nature reserve lake
('Bornsjön', 'bornsjon', 'Botkyrka',
  ST_GeomFromText('POLYGON((17.7123 59.1501, 17.7267 59.1589, 17.7434 59.1578, 17.7523 59.1501, 17.7478 59.1412, 17.7312 59.1378, 17.7189 59.1423, 17.7123 59.1501))', 4326),
  6.3, 'Protected nature reserve lake. When accessible, offers pristine skating conditions.'),

-- Judarn - Small lake near Bromma
('Judarn', 'judarn', 'Bromma',
  ST_GeomFromText('POLYGON((17.9234 59.3534, 17.9289 59.3578, 17.9367 59.3567, 17.9401 59.3523, 17.9356 59.3489, 17.9278 59.3489, 17.9234 59.3534))', 4326),
  0.15, 'Small neighborhood lake in western Stockholm. Often one of the first to freeze.'),

-- Långsjön - Nacka
('Långsjön', 'langsjon-nacka', 'Nacka',
  ST_GeomFromText('POLYGON((18.1456 59.2789, 18.1534 59.2856, 18.1645 59.2845, 18.1712 59.2778, 18.1667 59.2712, 18.1534 59.2701, 18.1456 59.2789))', 4326),
  0.52, 'Long narrow lake in Nacka. Popular summer swimming spot, occasional winter skating.')

ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- INITIAL ICE REPORTS (Sample Data)
-- ================================================

-- Add some initial ice reports for testing
INSERT INTO ice_reports (lake_id, status, source, ice_thickness_cm, surface_condition, raw_text, scraped_at)
SELECT 
  l.id,
  CASE 
    WHEN l.slug IN ('brunnsviken', 'trekanten', 'norrviken') THEN 'safe'
    WHEN l.slug IN ('flaten', 'orlangen', 'judarn') THEN 'safe'
    WHEN l.slug IN ('malaren-ekeroviken', 'valsjon') THEN 'uncertain'
    WHEN l.slug IN ('magelungen', 'altasjon') THEN 'uncertain'
    WHEN l.slug IN ('drevviken', 'bornsjon') THEN 'warning'
    ELSE 'no_ice'
  END,
  'official',
  CASE 
    WHEN l.slug IN ('brunnsviken', 'norrviken') THEN 15
    WHEN l.slug IN ('trekanten', 'judarn') THEN 12
    WHEN l.slug IN ('flaten', 'orlangen') THEN 14
    WHEN l.slug IN ('malaren-ekeroviken', 'valsjon', 'magelungen') THEN 8
    WHEN l.slug IN ('altasjon') THEN 7
    WHEN l.slug IN ('drevviken', 'bornsjon') THEN 5
    ELSE NULL
  END,
  CASE 
    WHEN l.slug IN ('brunnsviken', 'norrviken', 'trekanten') THEN 'plogad'
    WHEN l.slug IN ('flaten', 'orlangen', 'judarn') THEN 'smooth'
    WHEN l.slug IN ('malaren-ekeroviken', 'magelungen', 'altasjon', 'valsjon') THEN 'rough'
    WHEN l.slug IN ('drevviken', 'bornsjon') THEN 'snow_covered'
    ELSE 'unknown'
  END,
  CASE 
    WHEN l.slug = 'brunnsviken' THEN 'Brunnsviken: Isen är godkänd för skridskoåkning. Plogad och preparerad.'
    WHEN l.slug = 'trekanten' THEN 'Trekanten: Bra is, plogad. Perfekt för nybörjare.'
    WHEN l.slug = 'norrviken' THEN 'Norrviken: Utmärkt skridskois. Plogade banor ca 8 km.'
    WHEN l.slug = 'flaten' THEN 'Flaten: Naturis i gott skick. Preparerad rundbana.'
    WHEN l.slug = 'malaren-ekeroviken' THEN 'Mälaren-Ekerö: Kontrollera isen före åkning. Ojämn is på vissa ställen.'
    WHEN l.slug = 'drevviken' THEN 'Drevviken: Varning - tunn is vid norra delen. Undvik området.'
    ELSE l.name || ': Status uppdaterad'
  END,
  NOW() - (random() * interval '24 hours')
FROM lakes l;

-- ================================================
-- DONE! Your database is ready.
-- ================================================

