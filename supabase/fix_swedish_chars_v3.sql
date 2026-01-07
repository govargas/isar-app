-- ================================================
-- FIX SWEDISH CHARACTERS - MATCH BY ASCII PARTS
-- Run this in Supabase SQL Editor
-- ================================================

-- Update based on unique ASCII substrings
UPDATE lakes SET name = 'Ältasjön', slug = 'altasjon' WHERE LOWER(name) LIKE '%lta%' AND LOWER(name) LIKE '%sj%n%' AND LOWER(name) NOT LIKE '%flaten%';

UPDATE lakes SET name = 'Bornsjön', slug = 'bornsjon' WHERE LOWER(name) LIKE 'born%';

UPDATE lakes SET name = 'Långsjön', slug = 'langsjon' WHERE LOWER(name) LIKE 'l%ng%sj%n' AND LOWER(name) NOT LIKE '%tutviken%';

UPDATE lakes SET name = 'Långsjön-Tutviken', slug = 'langsjon-tutviken' WHERE LOWER(name) LIKE '%tutviken%';

UPDATE lakes SET name = 'Orlången', slug = 'orlangen' WHERE LOWER(name) LIKE 'orl%ngen';

UPDATE lakes SET name = 'Råstasjön', slug = 'rastaasjon' WHERE LOWER(name) LIKE 'r%sta%';

UPDATE lakes SET name = 'Välsjön', slug = 'valsjon' WHERE LOWER(name) LIKE 'v%lsj%n';

UPDATE lakes SET name = 'Tyresö-Flaten', slug = 'tyreso-flaten' WHERE LOWER(name) LIKE 'tyre%flaten';

-- Fix region names
UPDATE lakes SET region = 'Ekerö' WHERE LOWER(region) LIKE 'eker%';

-- Verify
SELECT name, slug, region FROM lakes ORDER BY name;

