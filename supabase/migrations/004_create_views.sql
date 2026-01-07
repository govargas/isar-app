-- View for latest ice status per lake (combines official reports)
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
  -- Count only non-expired reports for the badge
  (
    SELECT COUNT(*)::INTEGER 
    FROM user_reports ur 
    WHERE ur.lake_id = l.id AND ur.expires_at > NOW()
  ) as recent_report_count,
  -- Also track total reports (including expired) for reference
  (
    SELECT COUNT(*)::INTEGER 
    FROM user_reports ur 
    WHERE ur.lake_id = l.id AND ur.reported_at > NOW() - INTERVAL '30 days'
  ) as total_report_count
FROM lakes l
LEFT JOIN ice_reports ir ON l.id = ir.lake_id
ORDER BY l.id, ir.scraped_at DESC NULLS LAST;

COMMENT ON VIEW lake_current_status IS 'Denormalized view showing current ice status for each lake';

-- View for all recent community reports (including expired) with lake info
CREATE OR REPLACE VIEW all_user_reports AS
SELECT 
  ur.*,
  l.name as lake_name,
  l.slug as lake_slug,
  ur.expires_at < NOW() as is_expired
FROM user_reports ur
JOIN lakes l ON ur.lake_id = l.id
WHERE ur.reported_at > NOW() - INTERVAL '30 days'  -- Only last 30 days
ORDER BY ur.reported_at DESC;

COMMENT ON VIEW all_user_reports IS 'All community reports from the last 30 days, including expired ones marked with is_expired flag';

-- Legacy view for backwards compatibility (only active reports)
CREATE OR REPLACE VIEW active_user_reports AS
SELECT 
  ur.*,
  l.name as lake_name,
  l.slug as lake_slug
FROM user_reports ur
JOIN lakes l ON ur.lake_id = l.id
WHERE ur.expires_at > NOW()
ORDER BY ur.reported_at DESC;

COMMENT ON VIEW active_user_reports IS 'Active (non-expired) community reports with lake information';

-- Function to get nearby lakes within a radius (km)
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

COMMENT ON FUNCTION get_nearby_lakes IS 'Get lakes within a specified radius of a point, ordered by distance';

-- Function to get lake statistics
CREATE OR REPLACE FUNCTION get_lake_statistics()
RETURNS TABLE (
  total_lakes BIGINT,
  safe_count BIGINT,
  uncertain_count BIGINT,
  warning_count BIGINT,
  no_ice_count BIGINT,
  unknown_count BIGINT,
  total_active_reports BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_lakes,
    COUNT(*) FILTER (WHERE status = 'safe')::BIGINT as safe_count,
    COUNT(*) FILTER (WHERE status = 'uncertain')::BIGINT as uncertain_count,
    COUNT(*) FILTER (WHERE status = 'warning')::BIGINT as warning_count,
    COUNT(*) FILTER (WHERE status = 'no_ice')::BIGINT as no_ice_count,
    COUNT(*) FILTER (WHERE status IS NULL)::BIGINT as unknown_count,
    (SELECT COUNT(*) FROM user_reports WHERE expires_at > NOW())::BIGINT as total_active_reports
  FROM lake_current_status;
END;
$$ LANGUAGE plpgsql STABLE;

