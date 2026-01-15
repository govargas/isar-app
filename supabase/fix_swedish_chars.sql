-- ================================================
-- FIX SWEDISH CHARACTERS IN LAKE NAMES
-- Run this in Supabase SQL Editor
-- ================================================

-- Update lake names with correct Swedish characters
UPDATE lakes SET name = 'Ältasjön' WHERE slug = 'altasjon';
UPDATE lakes SET name = 'Bornsjön' WHERE slug = 'bornsjon';
UPDATE lakes SET name = 'Långsjön' WHERE slug = 'langsjon';
UPDATE lakes SET name = 'Långsjön-Tutviken' WHERE slug = 'langsjon-tutviken';
UPDATE lakes SET name = 'Orlången' WHERE slug = 'orlangen';
UPDATE lakes SET name = 'Råstasjön' WHERE slug = 'rastaasjon' OR slug = 'rastasjn' OR name ILIKE '%sta%j%n%';
UPDATE lakes SET name = 'Välsjön' WHERE slug = 'valsjon';
UPDATE lakes SET name = 'Tyresö-Flaten' WHERE slug = 'tyreso-flaten' OR name ILIKE '%tyre%flaten%';

-- Also fix region names if needed
UPDATE lakes SET region = 'Ekerö' WHERE region ILIKE '%eker%' AND region != 'Ekerö';
UPDATE lakes SET region = 'Tyresö' WHERE region ILIKE '%tyre%' AND region != 'Tyresö';

-- Fix any slugs that might have encoding issues
UPDATE lakes SET slug = 'altasjon' WHERE name = 'Ältasjön';
UPDATE lakes SET slug = 'bornsjon' WHERE name = 'Bornsjön';
UPDATE lakes SET slug = 'langsjon' WHERE name = 'Långsjön' AND slug NOT LIKE '%tutviken%';
UPDATE lakes SET slug = 'langsjon-tutviken' WHERE name = 'Långsjön-Tutviken';
UPDATE lakes SET slug = 'orlangen' WHERE name = 'Orlången';
UPDATE lakes SET slug = 'rastaasjon' WHERE name = 'Råstasjön';
UPDATE lakes SET slug = 'valsjon' WHERE name = 'Välsjön';
UPDATE lakes SET slug = 'tyreso-flaten' WHERE name = 'Tyresö-Flaten';

-- Verify the changes
SELECT name, slug, region FROM lakes ORDER BY name;


