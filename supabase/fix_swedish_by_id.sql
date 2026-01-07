-- ================================================
-- FIX SWEDISH CHARACTERS BY EXACT ID
-- ================================================

-- Fix lake names
UPDATE lakes SET name = 'Ältasjön', slug = 'altasjon' 
WHERE id = 'c14d87b5-a2ae-4df8-ab7d-97c608ecd31b';

UPDATE lakes SET name = 'Bornsjön', slug = 'bornsjon' 
WHERE id = 'ceba4ad7-7964-4a44-a3d6-4581224dbf84';

UPDATE lakes SET name = 'Långsjön', slug = 'langsjon' 
WHERE id = '3b256fe3-0871-44fc-a1e2-4b9e76fecacf';

UPDATE lakes SET name = 'Långsjön-Tutviken', slug = 'langsjon-tutviken' 
WHERE id = '7c26fab8-acfd-4374-8bda-476ec50ac67f';

UPDATE lakes SET name = 'Orlången', slug = 'orlangen' 
WHERE id = 'ef1c7c39-105b-47ad-8a12-353cd3c061bb';

UPDATE lakes SET name = 'Råstasjön', slug = 'rastaasjon' 
WHERE id = 'ae31ec2a-2331-4760-9b97-88ea72bcd524';

UPDATE lakes SET name = 'Tyresö-Flaten', slug = 'tyreso-flaten' 
WHERE id = 'e28127ea-2a6f-4963-9717-25108c679d94';

-- Fix region
UPDATE lakes SET region = 'Ekerö' 
WHERE id = '131a5c01-564f-4e54-86a2-b3dcc52a8078';

-- Verify
SELECT name, slug, region FROM lakes ORDER BY name;

