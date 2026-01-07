-- ================================================
-- FIX SWEDISH CHARACTERS IN ICE_REPORTS
-- ================================================

-- Update source field using the corrected lake names
UPDATE ice_reports ir SET 
  source = l.name || ': Status uppdaterad'
FROM lakes l 
WHERE ir.lake_id = l.id 
AND ir.source LIKE '%Status uppdaterad%';

-- Verify
SELECT ir.id, l.name as lake_name, ir.source, ir.status, ir.ice_thickness_cm
FROM ice_reports ir 
JOIN lakes l ON ir.lake_id = l.id
ORDER BY ir.reported_at DESC
LIMIT 20;
