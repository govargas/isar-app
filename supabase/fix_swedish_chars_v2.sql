-- ================================================
-- FIX SWEDISH CHARACTERS - ROBUST VERSION
-- Run this in Supabase SQL Editor
-- ================================================

-- First, let's see what we have
SELECT id, name, slug, region FROM lakes;

-- Update using pattern matching on the broken characters
UPDATE lakes SET name = 'Ältasjön', slug = 'altasjon' 
WHERE name LIKE '%lta%j%n' AND name LIKE '%√%';

UPDATE lakes SET name = 'Bornsjön', slug = 'bornsjon' 
WHERE name LIKE 'Born%j%n';

UPDATE lakes SET name = 'Långsjön', slug = 'langsjon' 
WHERE name LIKE 'L%ng%j%n' AND name NOT LIKE '%Tutviken%' AND name LIKE '%√%';

UPDATE lakes SET name = 'Långsjön-Tutviken', slug = 'langsjon-tutviken' 
WHERE name LIKE 'L%ng%j%n%Tutviken%';

UPDATE lakes SET name = 'Orlången', slug = 'orlangen' 
WHERE name LIKE 'Orl%ngen';

UPDATE lakes SET name = 'Råstasjön', slug = 'rastaasjon' 
WHERE name LIKE 'R%sta%j%n';

UPDATE lakes SET name = 'Välsjön', slug = 'valsjon' 
WHERE name LIKE 'V%lsj%n';

UPDATE lakes SET name = 'Tyresö-Flaten', slug = 'tyreso-flaten' 
WHERE name LIKE 'Tyre%Flaten';

-- Fix regions
UPDATE lakes SET region = 'Ekerö' WHERE region LIKE 'Eker%' AND region LIKE '%√%';
UPDATE lakes SET region = 'Tyresö' WHERE region LIKE 'Tyre%' AND region LIKE '%√%';

-- Verify the changes
SELECT id, name, slug, region FROM lakes ORDER BY name;


