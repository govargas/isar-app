-- ================================================
-- CLEANUP: Remove all fake/seed ice_reports
-- Keep only reports from the real scraper
-- ================================================

-- First, let's see what we have
SELECT ir.id, l.name, ir.status, ir.raw_text, ir.scraped_at
FROM ice_reports ir
JOIN lakes l ON ir.lake_id = l.id
ORDER BY ir.scraped_at DESC;

-- Delete ALL old seed data (keep only recent scraper data)
-- The scraper creates reports with source = 'official'
-- Old seed data was created more than 1 hour ago

DELETE FROM ice_reports 
WHERE scraped_at < NOW() - INTERVAL '1 hour';

-- Verify what's left (should only be real scraped data)
SELECT ir.id, l.name, ir.status, ir.raw_text, ir.scraped_at
FROM ice_reports ir
JOIN lakes l ON ir.lake_id = l.id
ORDER BY ir.scraped_at DESC;

