import { formatDistanceToNow } from 'date-fns';
import { StatusChip } from './StatusChip';
import { SURFACE_CONDITIONS } from '@/lib/constants';
import type { UserReport } from '@/types';
import { getReportFreshness, isReportExpired } from '@/types';

interface UserReportCardProps {
  report: UserReport;
}

export function UserReportCard({ report }: UserReportCardProps) {
  const freshness = getReportFreshness(report);
  const expired = isReportExpired(report);

  // Freshness styling
  const freshnessConfig = {
    fresh: {
      icon: '🟢',
      label: 'Fresh',
      opacity: 'opacity-100',
      border: 'border-green-500/30',
    },
    aging: {
      icon: '🟡',
      label: 'Aging',
      opacity: 'opacity-90',
      border: 'border-yellow-500/20',
    },
    stale: {
      icon: '🟠',
      label: 'Stale',
      opacity: 'opacity-70',
      border: 'border-orange-500/20',
    },
    expired: {
      icon: '⚪',
      label: 'Expired',
      opacity: 'opacity-50',
      border: 'border-[var(--color-frost-dim)]/10',
    },
  };

  const config = freshnessConfig[freshness];

  return (
    <div
      className={`p-3 rounded-lg bg-[var(--color-bg-surface)] border ${config.border} ${config.opacity} transition-opacity`}
    >
      {expired && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-frost-dim)] mb-2 pb-2 border-b border-[var(--color-frost-dim)]/10">
          <span>⏱️</span>
          <span>This report is older than 24 hours and may be outdated</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusChip status={report.status} size="sm" />
            <span className="text-xs text-[var(--color-frost-dim)]" title={config.label}>
              {config.icon}
            </span>
          </div>

          {report.surface_condition && (
            <p className="text-sm text-[var(--color-frost-muted)] mb-1">
              Surface: {SURFACE_CONDITIONS[report.surface_condition]?.label || report.surface_condition}
            </p>
          )}

          {report.comment && (
            <p className="text-sm text-[var(--color-frost-white)] line-clamp-2">
              "{report.comment}"
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[var(--color-frost-muted)]">
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
          </p>
          {report.upvotes > 0 && (
            <p className="text-xs text-[var(--color-ice-primary)] mt-1">
              👍 {report.upvotes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

