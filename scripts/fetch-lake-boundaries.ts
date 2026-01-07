/**
 * Fetch real lake boundaries from OpenStreetMap using Overpass API
 * Run with: npx tsx scripts/fetch-lake-boundaries.ts
 */

// Stockholm area bounding box (south, west, north, east)
const STOCKHOLM_BBOX = '59.1,17.7,59.5,18.4';

// Lakes we want to fetch (OSM names)
const TARGET_LAKES = [
  'Brunnsviken',
  'Trekanten',
  'Flaten',
  'Magelungen',
  'Drevviken',
  'Orlången',
  'Ältasjön',
  'Norrviken',
  'Välsjön',
  'Bornsjön',
  'Judarn',
  'Långsjön',
  'Råstasjön',
  'Edsviken',
  'Ulvsundasjön',
];

interface OSMElement {
  type: 'way' | 'relation';
  id: number;
  tags?: {
    name?: string;
    natural?: string;
    water?: string;
  };
  geometry?: Array<{ lat: number; lon: number }>;
  members?: Array<{
    type: string;
    ref: number;
    role: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
}

interface OverpassResponse {
  elements: OSMElement[];
}

async function fetchLakesFromOverpass(): Promise<OverpassResponse> {
  // Direct bounding box query for all water bodies with names
  const query = `
    [out:json][timeout:180];
    (
      way["natural"="water"]["name"](${STOCKHOLM_BBOX});
      relation["natural"="water"]["name"](${STOCKHOLM_BBOX});
    );
    out body geom;
  `;

  console.log('🌐 Fetching lakes from Overpass API...');
  console.log('   (This may take 1-2 minutes...)');
  
  // Try multiple Overpass endpoints
  const endpoints = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass-api.de/api/interpreter',
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`   Trying ${endpoint}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      
      clearTimeout(timeout);

      if (response.ok) {
        console.log(`   ✅ Success from ${endpoint}`);
        return response.json();
      }
      console.log(`   ⚠️ ${endpoint} returned ${response.status}`);
    } catch (e: any) {
      console.log(`   ⚠️ ${endpoint} failed: ${e.message || e}`);
    }
  }
  
  throw new Error('All Overpass endpoints failed');
}

function extractPolygonFromWay(element: OSMElement): number[][] | null {
  if (!element.geometry || element.geometry.length < 4) return null;
  
  // Convert to GeoJSON coordinate format [lon, lat]
  const coords = element.geometry.map(p => [p.lon, p.lat]);
  
  // Ensure polygon is closed
  if (coords[0][0] !== coords[coords.length - 1][0] || 
      coords[0][1] !== coords[coords.length - 1][1]) {
    coords.push(coords[0]);
  }
  
  return coords;
}

function extractPolygonFromRelation(element: OSMElement): number[][] | null {
  if (!element.members) return null;
  
  // Find outer way(s)
  const outerMembers = element.members.filter(m => m.role === 'outer' && m.geometry);
  if (outerMembers.length === 0) return null;
  
  // Use first outer ring (simplified - proper handling would merge multiple outers)
  const outerGeom = outerMembers[0].geometry;
  if (!outerGeom || outerGeom.length < 4) return null;
  
  const coords = outerGeom.map(p => [p.lon, p.lat]);
  
  // Ensure polygon is closed
  if (coords[0][0] !== coords[coords.length - 1][0] || 
      coords[0][1] !== coords[coords.length - 1][1]) {
    coords.push(coords[0]);
  }
  
  return coords;
}

function calculateCentroid(coords: number[][]): [number, number] {
  let sumLon = 0, sumLat = 0;
  const n = coords.length - 1; // Exclude closing point
  
  for (let i = 0; i < n; i++) {
    sumLon += coords[i][0];
    sumLat += coords[i][1];
  }
  
  return [sumLon / n, sumLat / n];
}

function calculateArea(coords: number[][]): number {
  // Shoelace formula (approximate, good enough for small areas)
  let area = 0;
  const n = coords.length - 1;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  
  // Convert to approximate km² (very rough for lat/lon)
  // At Stockholm's latitude, 1 degree ≈ 55km lat, 111km lon
  return Math.abs(area) * 0.5 * 55 * 111;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getRegion(centroid: [number, number], name: string): string {
  const [lon, lat] = centroid;
  
  // Rough region mapping based on coordinates
  if (lat > 59.4) return 'Sollentuna';
  if (lon < 17.9 && lat < 59.25) return 'Botkyrka';
  if (lon < 17.95) return 'Ekerö';
  if (lon > 18.15) return 'Nacka';
  if (lat < 59.25) return 'Huddinge';
  if (lat < 59.28 && lon > 18.05) return 'Tyresö';
  if (lat < 59.28) return 'Haninge';
  if (lon < 18.0) return 'Bromma';
  return 'Stockholm';
}

async function main() {
  try {
    const data = await fetchLakesFromOverpass();
    console.log(`📍 Found ${data.elements.length} water bodies`);

    const lakes: Array<{
      name: string;
      slug: string;
      region: string;
      osm_id: string;
      coordinates: number[][];
      centroid: [number, number];
      area_km2: number;
    }> = [];

    for (const element of data.elements) {
      const name = element.tags?.name;
      if (!name) continue;

      // Check if this is a lake we want
      const isTargetLake = TARGET_LAKES.some(
        target => name.toLowerCase().includes(target.toLowerCase()) ||
                  target.toLowerCase().includes(name.toLowerCase())
      );

      if (!isTargetLake) continue;

      let coords: number[][] | null = null;

      if (element.type === 'way') {
        coords = extractPolygonFromWay(element);
      } else if (element.type === 'relation') {
        coords = extractPolygonFromRelation(element);
      }

      if (!coords || coords.length < 4) {
        console.log(`⚠️  Skipping ${name} - invalid geometry`);
        continue;
      }

      const centroid = calculateCentroid(coords);
      const area = calculateArea(coords);

      // Skip very small water bodies (< 0.01 km²)
      if (area < 0.01) {
        console.log(`⚠️  Skipping ${name} - too small (${area.toFixed(3)} km²)`);
        continue;
      }

      // Check for duplicates (same name)
      const existingIdx = lakes.findIndex(l => l.name === name);
      if (existingIdx >= 0) {
        // Keep the larger one
        if (area > lakes[existingIdx].area_km2) {
          lakes[existingIdx] = {
            name,
            slug: slugify(name),
            region: getRegion(centroid, name),
            osm_id: `${element.type}/${element.id}`,
            coordinates: coords,
            centroid,
            area_km2: area,
          };
        }
        continue;
      }

      lakes.push({
        name,
        slug: slugify(name),
        region: getRegion(centroid, name),
        osm_id: `${element.type}/${element.id}`,
        coordinates: coords,
        centroid,
        area_km2: area,
      });

      console.log(`✅ ${name} (${area.toFixed(2)} km²) - ${coords.length} points`);
    }

    console.log(`\n🎯 Found ${lakes.length} target lakes\n`);

    // Generate SQL for updating Supabase
    let sql = `-- Real lake boundaries from OpenStreetMap
-- Generated: ${new Date().toISOString()}
-- Source: Overpass API

-- First, delete existing lakes and their reports
DELETE FROM ice_reports;
DELETE FROM user_reports;
DELETE FROM lakes;

-- Insert lakes with real boundaries
INSERT INTO lakes (name, slug, region, geometry, area_km2, description) VALUES\n`;

    const values = lakes.map((lake, i) => {
      const coordString = lake.coordinates.map(c => `${c[0]} ${c[1]}`).join(', ');
      const description = getLakeDescription(lake.name);
      
      return `('${lake.name.replace(/'/g, "''")}', '${lake.slug}', '${lake.region}', 
  ST_GeomFromText('POLYGON((${coordString}))', 4326),
  ${lake.area_km2.toFixed(2)}, '${description.replace(/'/g, "''")}')`;
    });

    sql += values.join(',\n\n');
    sql += ';\n';

    // Save SQL file
    const fs = await import('fs');
    fs.writeFileSync('supabase/real_lakes.sql', sql);
    console.log('💾 Saved to supabase/real_lakes.sql');

    // Also output JSON for reference
    fs.writeFileSync('scripts/lakes-data.json', JSON.stringify(lakes, null, 2));
    console.log('💾 Saved to scripts/lakes-data.json');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function getLakeDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'Brunnsviken': 'Popular skating lake in central Stockholm between Haga and the university. Often has well-maintained plowed tracks.',
    'Trekanten': 'Small triangular lake in Liljeholmen, perfect for beginners and families. Easy to access by public transport.',
    'Flaten': 'Beautiful nature reserve lake in Tyresö with excellent natural ice conditions.',
    'Magelungen': 'Large lake in southern Stockholm, great for long-distance skating when conditions permit.',
    'Drevviken': 'Long lake stretching from Älta to Haninge, excellent for touring on good ice years.',
    'Orlången': 'Scenic nature reserve lake in Huddinge with varied terrain.',
    'Ältasjön': 'Lake in Nacka municipality, part of the Nacka nature reserve.',
    'Norrviken': 'Popular skating lake north of Stockholm with well-organized skating tracks.',
    'Välsjön': 'Small lake in Järfälla nature reserve.',
    'Bornsjön': 'Protected nature reserve lake with pristine skating conditions when accessible.',
    'Judarn': 'Small neighborhood lake in western Stockholm, often one of the first to freeze.',
    'Långsjön': 'Long narrow lake, popular for both summer swimming and winter skating.',
    'Råstasjön': 'Urban lake near Solna, easy access from the city.',
    'Edsviken': 'Bay in northern Stockholm, can offer good skating in cold winters.',
    'Ulvsundasjön': 'Lake between Bromma and Sundbyberg.',
  };
  
  return descriptions[name] || `Lake in the Stockholm area, check current conditions before skating.`;
}

main();

