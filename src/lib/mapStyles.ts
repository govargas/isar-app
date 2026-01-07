// Custom MapLibre style for ISAR
// Based on dark-matter with ice-themed customizations

export const ISAR_MAP_STYLE = {
  version: 8,
  name: 'ISAR Dark',
  sources: {
    carto: {
      type: 'vector',
      url: 'https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json',
    },
  },
  sprite: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/sprite',
  glyphs: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0A0E14',
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'carto',
      'source-layer': 'water',
      paint: {
        'fill-color': '#121820',
        'fill-opacity': 0.8,
      },
    },
    {
      id: 'landcover',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landcover',
      paint: {
        'fill-color': '#0D1117',
        'fill-opacity': 0.5,
      },
    },
    {
      id: 'park',
      type: 'fill',
      source: 'carto',
      'source-layer': 'park',
      paint: {
        'fill-color': '#0D1A14',
        'fill-opacity': 0.6,
      },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'carto',
      'source-layer': 'transportation',
      filter: ['all', ['==', 'class', 'minor']],
      paint: {
        'line-color': '#1A2330',
        'line-width': 1,
      },
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'carto',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'primary', 'secondary', 'tertiary'],
      paint: {
        'line-color': '#232D3F',
        'line-width': 2,
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'carto',
      'source-layer': 'building',
      paint: {
        'fill-color': '#161D26',
        'fill-opacity': 0.8,
      },
    },
    {
      id: 'place-label',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      layout: {
        'text-field': '{name}',
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#5C6B77',
        'text-halo-color': '#0A0E14',
        'text-halo-width': 1,
      },
    },
  ],
} as const;

// Simple dark style URL (fallback)
export const DARK_MATTER_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Positron style for lighter theme (if needed)
export const POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

