// Mock data for development without Supabase
import type { LakeWithStatus, IceStatus } from '@/types';

export const MOCK_LAKES: LakeWithStatus[] = [
  {
    id: '1',
    name: 'Brunnsviken',
    slug: 'brunnsviken',
    region: 'Stockholm',
    geometry: {
      type: 'Polygon',
      coordinates: [[[18.03, 59.36], [18.06, 59.37], [18.08, 59.36], [18.07, 59.34], [18.04, 59.34], [18.03, 59.36]]],
    },
    centroid: { type: 'Point', coordinates: [18.055, 59.355] },
    area_km2: 2.1,
    typical_freeze_date: '2025-01-20',
    created_at: new Date().toISOString(),
    status: 'safe' as IceStatus,
    ice_thickness_cm: 15,
    surface_condition: 'plogad',
    last_updated: new Date().toISOString(),
    recent_report_count: 3,
  },
  {
    id: '2',
    name: 'Trekanten',
    slug: 'trekanten',
    region: 'Stockholm',
    geometry: {
      type: 'Polygon',
      coordinates: [[[18.01, 59.31], [18.02, 59.32], [18.03, 59.31], [18.02, 59.30], [18.01, 59.31]]],
    },
    centroid: { type: 'Point', coordinates: [18.02, 59.31] },
    area_km2: 0.3,
    typical_freeze_date: '2025-01-18',
    created_at: new Date().toISOString(),
    status: 'safe' as IceStatus,
    ice_thickness_cm: 12,
    surface_condition: 'smooth',
    last_updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    recent_report_count: 1,
  },
  {
    id: '3',
    name: 'Flaten',
    slug: 'flaten',
    region: 'Nacka',
    geometry: {
      type: 'Polygon',
      coordinates: [[[18.18, 59.26], [18.22, 59.27], [18.24, 59.26], [18.22, 59.24], [18.19, 59.24], [18.18, 59.26]]],
    },
    centroid: { type: 'Point', coordinates: [18.21, 59.255] },
    area_km2: 1.8,
    typical_freeze_date: '2025-01-12',
    created_at: new Date().toISOString(),
    status: 'safe' as IceStatus,
    ice_thickness_cm: 18,
    surface_condition: 'plogad',
    last_updated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    recent_report_count: 5,
  },
  {
    id: '4',
    name: 'Mälaren - Ekerö',
    slug: 'malaren-ekero',
    region: 'Ekerö',
    geometry: {
      type: 'Polygon',
      coordinates: [[[17.75, 59.30], [17.80, 59.32], [17.85, 59.31], [17.83, 59.28], [17.78, 59.27], [17.75, 59.30]]],
    },
    centroid: { type: 'Point', coordinates: [17.80, 59.295] },
    area_km2: 15.5,
    typical_freeze_date: '2025-01-15',
    created_at: new Date().toISOString(),
    status: 'uncertain' as IceStatus,
    ice_thickness_cm: 8,
    surface_condition: 'rough',
    last_updated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    recent_report_count: 2,
  },
  {
    id: '5',
    name: 'Norrviken',
    slug: 'norrviken',
    region: 'Sollentuna',
    geometry: {
      type: 'Polygon',
      coordinates: [[[17.92, 59.43], [17.96, 59.45], [18.00, 59.44], [17.98, 59.41], [17.93, 59.41], [17.92, 59.43]]],
    },
    centroid: { type: 'Point', coordinates: [17.96, 59.43] },
    area_km2: 4.1,
    typical_freeze_date: '2025-01-13',
    created_at: new Date().toISOString(),
    status: 'uncertain' as IceStatus,
    ice_thickness_cm: 10,
    surface_condition: 'rough',
    last_updated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    recent_report_count: 0,
  },
  {
    id: '6',
    name: 'Lilla Värtan',
    slug: 'lilla-vartan',
    region: 'Stockholm',
    geometry: {
      type: 'Polygon',
      coordinates: [[[18.08, 59.36], [18.12, 59.38], [18.16, 59.37], [18.14, 59.35], [18.10, 59.35], [18.08, 59.36]]],
    },
    centroid: { type: 'Point', coordinates: [18.12, 59.365] },
    area_km2: 4.5,
    typical_freeze_date: '2025-02-01',
    created_at: new Date().toISOString(),
    status: 'warning' as IceStatus,
    ice_thickness_cm: 5,
    surface_condition: 'rough',
    last_updated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    recent_report_count: 1,
  },
  {
    id: '7',
    name: 'Drevviken',
    slug: 'drevviken',
    region: 'Haninge',
    geometry: {
      type: 'Polygon',
      coordinates: [[[18.08, 59.20], [18.14, 59.22], [18.18, 59.21], [18.15, 59.18], [18.10, 59.18], [18.08, 59.20]]],
    },
    centroid: { type: 'Point', coordinates: [18.13, 59.20] },
    area_km2: 5.4,
    typical_freeze_date: '2025-01-16',
    created_at: new Date().toISOString(),
    status: 'no_ice' as IceStatus,
    ice_thickness_cm: null,
    surface_condition: null,
    last_updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    recent_report_count: 0,
  },
  {
    id: '8',
    name: 'Orlången',
    slug: 'orlangen',
    region: 'Huddinge',
    geometry: {
      type: 'Polygon',
      coordinates: [[[17.98, 59.22], [18.02, 59.24], [18.05, 59.23], [18.03, 59.20], [17.99, 59.20], [17.98, 59.22]]],
    },
    centroid: { type: 'Point', coordinates: [18.015, 59.22] },
    area_km2: 3.2,
    typical_freeze_date: '2025-01-14',
    created_at: new Date().toISOString(),
    status: 'safe' as IceStatus,
    ice_thickness_cm: 14,
    surface_condition: 'smooth',
    last_updated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    recent_report_count: 2,
  },
];

export function isMockMode(): boolean {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl === '' || supabaseUrl === 'https://your-project.supabase.co';
}

export function getMockLakeBySlug(slug: string): LakeWithStatus | null {
  return MOCK_LAKES.find(lake => lake.slug === slug) || null;
}

export const MOCK_ICE_REPORTS = [
  {
    id: 'r1',
    lake_id: '1',
    status: 'safe' as const,
    source: 'official' as const,
    ice_thickness_cm: 15,
    surface_condition: 'plogad',
    temperature_avg: -5.2,
    wind_speed_avg: 2.1,
    raw_text: 'Brunnsviken: Isen är godkänd för skridskoåkning. Plogad och preparerad.',
    scraped_at: new Date().toISOString(),
    valid_from: new Date().toISOString(),
    valid_until: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'r2',
    lake_id: '1',
    status: 'uncertain' as const,
    source: 'official' as const,
    ice_thickness_cm: 10,
    surface_condition: 'rough',
    temperature_avg: -3.0,
    wind_speed_avg: 4.5,
    raw_text: 'Brunnsviken: Kontrollera isen före åkning. Ojämn is på vissa ställen.',
    scraped_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    valid_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    valid_until: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_USER_REPORTS = [
  // Fresh report (< 12 hours old)
  {
    id: 'ur1',
    lake_id: '1',
    user_id: 'user1',
    status: 'safe' as const,
    surface_condition: 'smooth',
    comment: 'Skated here this morning - excellent conditions near the south end!',
    location: null,
    photo_url: null,
    upvotes: 5,
    reported_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  // Aging report (12-18 hours old)
  {
    id: 'ur2',
    lake_id: '1',
    user_id: 'user2',
    status: 'safe' as const,
    surface_condition: 'plogad',
    comment: 'Just finished 10km loop. Ice is perfect, recently plowed.',
    location: null,
    photo_url: null,
    upvotes: 3,
    reported_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
  },
  // Stale report (18-24 hours old)
  {
    id: 'ur3',
    lake_id: '1',
    user_id: 'user3',
    status: 'uncertain' as const,
    surface_condition: 'rough',
    comment: 'Watch out for cracks near the north shore. Otherwise okay.',
    location: null,
    photo_url: null,
    upvotes: 2,
    reported_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  // Expired report (> 24 hours old) - still visible but greyed out
  {
    id: 'ur4',
    lake_id: '1',
    user_id: 'user4',
    status: 'safe' as const,
    surface_condition: 'plogad',
    comment: 'Beautiful day for skating yesterday. Ice was thick and well maintained.',
    location: null,
    photo_url: null,
    upvotes: 8,
    reported_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // Expired 12 hours ago
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  // Another expired report
  {
    id: 'ur5',
    lake_id: '1',
    user_id: 'user5',
    status: 'warning' as const,
    surface_condition: 'snow_covered',
    comment: 'Heavy snow overnight made skating difficult. Needs plowing.',
    location: null,
    photo_url: null,
    upvotes: 4,
    reported_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired 24 hours ago
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export function getMockLakeReports(lakeId: string) {
  return MOCK_ICE_REPORTS.filter(r => r.lake_id === lakeId);
}

export function getMockUserReports(lakeId: string) {
  return MOCK_USER_REPORTS.filter(r => r.lake_id === lakeId);
}

