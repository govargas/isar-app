import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { LakeWithStatus } from '@/types';
import { StatusChip } from './StatusChip';
import { SURFACE_CONDITIONS } from '@/lib/constants';

interface LakeCardProps {
  lake: LakeWithStatus;
  onHover?: (id: string | null) => void;
  isHovered?: boolean;
  distance?: number; // in km
}

export function LakeCard({ lake, onHover, isHovered, distance }: LakeCardProps) {
  const hasOfficialData = lake.status !== null && lake.last_updated !== null;
  
  const lastUpdated = lake.last_updated
    ? formatDistanceToNow(new Date(lake.last_updated), { addSuffix: true })
    : null;

  const surfaceLabel = lake.surface_condition
    ? SURFACE_CONDITIONS[lake.surface_condition]?.label || lake.surface_condition
    : null;

  return (
    <Link
      to={`/lake/${lake.slug}`}
      className={`block p-4 rounded-xl transition-all duration-200 ${
        isHovered
          ? 'bg-[var(--color-bg-elevated)] shadow-lg ring-1 ring-[var(--color-ice-primary)]/30'
          : 'bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-elevated)]'
      } ${!hasOfficialData ? 'opacity-70' : ''}`}
      onMouseEnter={() => onHover?.(lake.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--color-frost-white)] truncate">
            {lake.name}
          </h3>
          {lake.region && (
            <p className="text-sm text-[var(--color-frost-muted)] mt-0.5">
              {lake.region}
            </p>
          )}
        </div>
        <StatusChip status={lake.status} size="sm" />
      </div>

      {!hasOfficialData ? (
        <p className="mt-3 text-xs text-[var(--color-frost-dim)] italic">
          No official data from Stockholm municipality
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-frost-muted)]">
            {/* Last updated */}
            {lastUpdated && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{lastUpdated}</span>
              </div>
            )}

            {/* Distance if available */}
            {distance !== undefined && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{distance.toFixed(1)} km</span>
              </div>
            )}

            {/* Report count */}
            {lake.recent_report_count > 0 && (
              <div className="flex items-center gap-1 text-[var(--color-ice-primary)]">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span>{lake.recent_report_count} report{lake.recent_report_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Additional info row */}
          {(lake.ice_thickness_cm || surfaceLabel) && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              {lake.ice_thickness_cm && (
                <span className="px-2 py-0.5 rounded bg-[var(--color-bg-deep)] text-[var(--color-frost-muted)]">
                  {lake.ice_thickness_cm} cm ice
                </span>
              )}
              {surfaceLabel && (
                <span className="px-2 py-0.5 rounded bg-[var(--color-bg-deep)] text-[var(--color-frost-muted)]">
                  {surfaceLabel}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </Link>
  );
}

// Compact version for list views
export function LakeCardCompact({ lake, onHover, isHovered }: LakeCardProps) {
  return (
    <Link
      to={`/lake/${lake.slug}`}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
        isHovered
          ? 'bg-[var(--color-bg-elevated)]'
          : 'hover:bg-[var(--color-bg-surface)]'
      }`}
      onMouseEnter={() => onHover?.(lake.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <StatusChip status={lake.status} size="sm" showLabel={false} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[var(--color-frost-white)] truncate block">
          {lake.name}
        </span>
      </div>
      {lake.recent_report_count > 0 && (
        <span className="text-xs text-[var(--color-ice-primary)]">
          {lake.recent_report_count}
        </span>
      )}
    </Link>
  );
}

