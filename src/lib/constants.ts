import type { IceStatus, MapViewState } from '@/types';

// Stockholm coordinates
export const STOCKHOLM_CENTER = {
  longitude: 18.0686,
  latitude: 59.3293,
};

export const INITIAL_VIEW_STATE: MapViewState = {
  longitude: STOCKHOLM_CENTER.longitude,
  latitude: STOCKHOLM_CENTER.latitude,
  zoom: 9,
  pitch: 45,
  bearing: -15,
};

// Map styles
export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Status configuration
export const STATUS_CONFIG: Record<
  IceStatus,
  {
    label: string;
    labelSv: string;
    color: string;
    bgColor: string;
    glowColor: string;
    icon: string;
    rgb: [number, number, number];
  }
> = {
  safe: {
    label: 'Safe',
    labelSv: 'Plogad',
    color: '#00E676',
    bgColor: 'rgba(0, 230, 118, 0.15)',
    glowColor: 'rgba(0, 230, 118, 0.3)',
    icon: '✓',
    rgb: [0, 230, 118],
  },
  uncertain: {
    label: 'Uncertain',
    labelSv: 'Osäker',
    color: '#FFAA00',
    bgColor: 'rgba(255, 170, 0, 0.15)',
    glowColor: 'rgba(255, 170, 0, 0.3)',
    icon: '?',
    rgb: [255, 170, 0],
  },
  warning: {
    label: 'Warning',
    labelSv: 'Varning',
    color: '#FF4757',
    bgColor: 'rgba(255, 71, 87, 0.15)',
    glowColor: 'rgba(255, 71, 87, 0.3)',
    icon: '⚠',
    rgb: [255, 71, 87],
  },
  no_ice: {
    label: 'No Ice',
    labelSv: 'Ingen is',
    color: '#9E9E9E',
    bgColor: 'rgba(158, 158, 158, 0.15)',
    glowColor: 'rgba(158, 158, 158, 0.2)',
    icon: '✗',
    rgb: [158, 158, 158],
  },
};

// Helper to get status color with alpha
export function getStatusColor(status: IceStatus | null, alpha: number = 255): [number, number, number, number] {
  if (!status) {
    return [100, 100, 100, alpha];
  }
  const config = STATUS_CONFIG[status];
  return [...config.rgb, alpha];
}

// Surface condition labels
export const SURFACE_CONDITIONS: Record<string, { label: string; labelSv: string }> = {
  smooth: { label: 'Smooth', labelSv: 'Slät' },
  rough: { label: 'Rough', labelSv: 'Ojämn' },
  snow_covered: { label: 'Snow Covered', labelSv: 'Snötäckt' },
  plogad: { label: 'Plowed', labelSv: 'Plogad' },
  unknown: { label: 'Unknown', labelSv: 'Okänd' },
};

// Regions in Stockholm area
export const REGIONS = [
  'Stockholm',
  'Mälaren',
  'Norrtälje',
  'Södertälje',
  'Nacka',
  'Värmdö',
  'Ekerö',
] as const;

// Time formatting
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';

