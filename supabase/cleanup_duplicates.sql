-- ================================================
-- CLEANUP: Remove duplicate ice_reports
-- Keep only the MOST RECENT report per lake
-- ================================================

-- First, let's see how many reports we have per lake
SELECT l.name, COUNT(*) as report_count
FROM ice_reports ir
JOIN lakes l ON ir.lake_id = l.id
GROUP BY l.name
ORDER BY report_count DESC;

-- Delete all but the most recent report for each lake
DELETE FROM ice_reports
WHERE id NOT IN (
  SELECT DISTINCT ON (lake_id) id
  FROM ice_reports
  ORDER BY lake_id, scraped_at DESC
);

-- Verify: should now have max 1 report per lake
SELECT l.name, ir.status, ir.raw_text, ir.scraped_at
FROM ice_reports ir
JOIN lakes l ON ir.lake_id = l.id
ORDER BY ir.scraped_at DESC;


