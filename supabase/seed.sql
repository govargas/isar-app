-- Seed data for Stockholm area lakes
-- These are approximate polygon geometries for major skating lakes

-- Note: For production, you'd want to get accurate GeoJSON from OpenStreetMap or similar sources
-- These are simplified polygons for demonstration

INSERT INTO lakes (name, slug, region, geometry, area_km2, typical_freeze_date, description) VALUES

-- Mälaren (large lake west of Stockholm)
('Mälaren - Ekerö', 'malaren-ekero', 'Ekerö', 
 ST_GeomFromText('POLYGON((17.75 59.30, 17.80 59.32, 17.85 59.31, 17.83 59.28, 17.78 59.27, 17.75 59.30))', 4326),
 15.5, '2025-01-15', 'Popular skating area on Mälaren near Ekerö. Often has good ice conditions.'),

('Mälaren - Kärsön', 'malaren-karson', 'Ekerö',
 ST_GeomFromText('POLYGON((17.68 59.33, 17.72 59.35, 17.76 59.34, 17.74 59.31, 17.70 59.31, 17.68 59.33))', 4326),
 8.2, '2025-01-10', 'Kärsön area of Mälaren, known for early ice formation.'),

-- Brunnsviken (central Stockholm)
('Brunnsviken', 'brunnsviken', 'Stockholm',
 ST_GeomFromText('POLYGON((18.03 59.36, 18.06 59.37, 18.08 59.36, 18.07 59.34, 18.04 59.34, 18.03 59.36))', 4326),
 2.1, '2025-01-20', 'Urban lake in central Stockholm. Accessible by public transport.'),

-- Djurgårdsbrunnsviken
('Djurgårdsbrunnsviken', 'djurgardsbrunnsviken', 'Stockholm',
 ST_GeomFromText('POLYGON((18.10 59.35, 18.12 59.36, 18.14 59.35, 18.13 59.34, 18.11 59.34, 18.10 59.35))', 4326),
 0.8, '2025-01-25', 'Small bay near Djurgården. Popular for beginners.'),

-- Trekanten
('Trekanten', 'trekanten', 'Stockholm',
 ST_GeomFromText('POLYGON((18.01 59.31, 18.02 59.32, 18.03 59.31, 18.02 59.30, 18.01 59.31))', 4326),
 0.3, '2025-01-18', 'Small triangular lake in Liljeholmen. Quick to freeze.'),

-- Flaten
('Flaten', 'flaten', 'Nacka',
 ST_GeomFromText('POLYGON((18.18 59.26, 18.22 59.27, 18.24 59.26, 18.22 59.24, 18.19 59.24, 18.18 59.26))', 4326),
 1.8, '2025-01-12', 'Nature reserve lake. Excellent for longer tours.'),

-- Orlången  
('Orlången', 'orlangen', 'Huddinge',
 ST_GeomFromText('POLYGON((17.98 59.22, 18.02 59.24, 18.05 59.23, 18.03 59.20, 17.99 59.20, 17.98 59.22))', 4326),
 3.2, '2025-01-14', 'Large lake south of Stockholm. Good for long-distance skating.'),

-- Drevviken
('Drevviken', 'drevviken', 'Haninge',
 ST_GeomFromText('POLYGON((18.08 59.20, 18.14 59.22, 18.18 59.21, 18.15 59.18, 18.10 59.18, 18.08 59.20))', 4326),
 5.4, '2025-01-16', 'Popular skating destination with varying ice quality zones.'),

-- Magelungen
('Magelungen', 'magelungen', 'Stockholm',
 ST_GeomFromText('POLYGON((18.04 59.26, 18.08 59.27, 18.10 59.26, 18.08 59.24, 18.05 59.24, 18.04 59.26))', 4326),
 2.9, '2025-01-19', 'Accessible lake between Farsta and Skarpnäck.'),

-- Ältasjön
('Ältasjön', 'altasjon', 'Nacka',
 ST_GeomFromText('POLYGON((18.15 59.28, 18.18 59.29, 18.20 59.28, 18.18 59.27, 18.16 59.27, 18.15 59.28))', 4326),
 1.2, '2025-01-17', 'Small lake in Älta. Often maintained for skating.'),

-- Värtan (sea ice)
('Lilla Värtan', 'lilla-vartan', 'Stockholm',
 ST_GeomFromText('POLYGON((18.08 59.36, 18.12 59.38, 18.16 59.37, 18.14 59.35, 18.10 59.35, 18.08 59.36))', 4326),
 4.5, '2025-02-01', 'Sea ice area. Requires careful checking due to currents.'),

-- Edsviken
('Edsviken', 'edsviken', 'Sollentuna',
 ST_GeomFromText('POLYGON((17.98 59.40, 18.02 59.42, 18.06 59.41, 18.04 59.38, 17.99 59.38, 17.98 59.40))', 4326),
 3.8, '2025-01-15', 'Bay north of Stockholm. Often has early ice.'),

-- Norrviken
('Norrviken', 'norrviken', 'Sollentuna',
 ST_GeomFromText('POLYGON((17.92 59.43, 17.96 59.45, 18.00 59.44, 17.98 59.41, 17.93 59.41, 17.92 59.43))', 4326),
 4.1, '2025-01-13', 'Popular skating lake with parking facilities.'),

-- Ravalen
('Ravalen', 'ravalen', 'Huddinge',
 ST_GeomFromText('POLYGON((17.88 59.24, 17.92 59.26, 17.96 59.25, 17.94 59.22, 17.89 59.22, 17.88 59.24))', 4326),
 2.3, '2025-01-11', 'Lake in Flemingsberg area. Good accessibility.'),

-- Uttran
('Uttran', 'uttran', 'Botkyrka',
 ST_GeomFromText('POLYGON((17.78 59.20, 17.84 59.22, 17.88 59.21, 17.85 59.18, 17.80 59.18, 17.78 59.20))', 4326),
 6.2, '2025-01-14', 'Large lake southwest of Stockholm. Excellent for touring.')

ON CONFLICT (slug) DO NOTHING;

-- Insert some sample ice reports for demonstration
INSERT INTO ice_reports (lake_id, status, source, ice_thickness_cm, surface_condition, temperature_avg, raw_text, scraped_at) 
SELECT 
  l.id,
  CASE 
    WHEN l.slug IN ('brunnsviken', 'trekanten', 'flaten') THEN 'safe'
    WHEN l.slug IN ('malaren-ekero', 'norrviken', 'ravalen') THEN 'uncertain'
    WHEN l.slug IN ('lilla-vartan') THEN 'warning'
    ELSE 'no_ice'
  END,
  'official',
  CASE 
    WHEN l.slug IN ('brunnsviken', 'trekanten', 'flaten') THEN 15
    WHEN l.slug IN ('malaren-ekero', 'norrviken') THEN 8
    ELSE NULL
  END,
  CASE 
    WHEN l.slug IN ('brunnsviken', 'flaten') THEN 'plogad'
    WHEN l.slug IN ('trekanten') THEN 'smooth'
    WHEN l.slug IN ('malaren-ekero', 'norrviken') THEN 'rough'
    ELSE NULL
  END,
  -5.2,
  'Sample ice report for demonstration purposes.',
  NOW()
FROM lakes l
ON CONFLICT DO NOTHING;

-- Log initial seed
INSERT INTO scrape_logs (source, status, lakes_updated, duration_ms)
VALUES ('seed', 'success', 15, 0);

