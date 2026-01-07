// Ice Status Types
export type IceStatus = 'safe' | 'uncertain' | 'warning' | 'no_ice';

export type SurfaceCondition = 'smooth' | 'rough' | 'snow_covered' | 'plogad' | 'unknown';

export type DataSource = 'official' | 'forecast' | 'satellite' | 'user';

// Database Types
export interface Lake {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  geometry: GeoJSONPolygon;
  centroid: GeoJSONPoint;
  area_km2: number | null;
  typical_freeze_date: string | null;
  created_at: string;
}

export interface IceReport {
  id: string;
  lake_id: string;
  status: IceStatus;
  source: DataSource;
  ice_thickness_cm: number | null;
  surface_condition: SurfaceCondition | null;
  temperature_avg: number | null;
  wind_speed_avg: number | null;
  raw_text: string | null;
  scraped_at: string;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export interface UserReport {
  id: string;
  lake_id: string;
  user_id: string | null;
  status: IceStatus | null;
  surface_condition: SurfaceCondition | null;
  comment: string | null;
  location: GeoJSONPoint | null;
  photo_url: string | null;
  upvotes: number;
  reported_at: string;
  expires_at: string;
  created_at: string;
}

// Helper to check if a report is expired/stale
export function isReportExpired(report: UserReport): boolean {
  return new Date(report.expires_at) < new Date();
}

// Helper to get report freshness level
export type ReportFreshness = 'fresh' | 'aging' | 'stale' | 'expired';

export function getReportFreshness(report: UserReport): ReportFreshness {
  const now = new Date();
  const reportedAt = new Date(report.reported_at);
  const expiresAt = new Date(report.expires_at);
  const hoursOld = (now.getTime() - reportedAt.getTime()) / (1000 * 60 * 60);
  
  if (now > expiresAt) return 'expired';
  if (hoursOld > 18) return 'stale';      // 18-24 hours old
  if (hoursOld > 12) return 'aging';      // 12-18 hours old
  return 'fresh';                          // < 12 hours old
}

// Composite Types
export interface LakeWithStatus extends Lake {
  status: IceStatus | null;
  ice_thickness_cm: number | null;
  surface_condition: SurfaceCondition | null;
  last_updated: string | null;
  recent_report_count: number;
  user_reports?: UserReport[];
}

// GeoJSON Types
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface GeoJSONFeature<G = GeoJSONPolygon, P = Record<string, unknown>> {
  type: 'Feature';
  geometry: G;
  properties: P;
}

export interface GeoJSONFeatureCollection<G = GeoJSONPolygon, P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<G, P>[];
}

// Lake as GeoJSON Feature for map rendering
export type LakeFeature = GeoJSONFeature<GeoJSONPolygon, LakeWithStatus>;

// Filter Types
export interface FilterState {
  status: IceStatus[];
  sortBy: 'name' | 'status' | 'distance' | 'updated' | 'reports';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Map View State
export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

