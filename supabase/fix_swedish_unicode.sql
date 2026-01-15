-- ================================================
-- FIX SWEDISH CHARACTERS USING UNICODE CODE POINTS
-- This avoids copy/paste encoding issues
-- ================================================

-- Swedish characters:
-- ä = CHR(228), ö = CHR(246), å = CHR(229)
-- Ä = CHR(196), Ö = CHR(214), Å = CHR(197)
-- é = CHR(233)

UPDATE lakes SET name = CHR(196) || 'ltasj' || CHR(246) || 'n', slug = 'altasjon' 
WHERE id = 'c14d87b5-a2ae-4df8-ab7d-97c608ecd31b';

UPDATE lakes SET name = 'Bornsj' || CHR(246) || 'n', slug = 'bornsjon' 
WHERE id = 'ceba4ad7-7964-4a44-a3d6-4581224dbf84';

UPDATE lakes SET name = 'L' || CHR(229) || 'ngsj' || CHR(246) || 'n', slug = 'langsjon' 
WHERE id = '3b256fe3-0871-44fc-a1e2-4b9e76fecacf';

UPDATE lakes SET name = 'L' || CHR(229) || 'ngsj' || CHR(246) || 'n-Tutviken', slug = 'langsjon-tutviken' 
WHERE id = '7c26fab8-acfd-4374-8bda-476ec50ac67f';

UPDATE lakes SET name = 'Orl' || CHR(229) || 'ngen', slug = 'orlangen' 
WHERE id = 'ef1c7c39-105b-47ad-8a12-353cd3c061bb';

UPDATE lakes SET name = 'R' || CHR(229) || 'stasj' || CHR(246) || 'n', slug = 'rastaasjon' 
WHERE id = 'ae31ec2a-2331-4760-9b97-88ea72bcd524';

UPDATE lakes SET name = 'Tyres' || CHR(246) || '-Flaten', slug = 'tyreso-flaten' 
WHERE id = 'e28127ea-2a6f-4963-9717-25108c679d94';

UPDATE lakes SET region = 'Eker' || CHR(246)
WHERE id = '131a5c01-564f-4e54-86a2-b3dcc52a8078';

-- Verify
SELECT name, slug, region FROM lakes ORDER BY name;


