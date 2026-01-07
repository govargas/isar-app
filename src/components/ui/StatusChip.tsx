import type { IceStatus } from '@/types';
import { STATUS_CONFIG } from '@/lib/constants';

interface StatusChipProps {
  status: IceStatus | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  swedish?: boolean;
  className?: string;
}

export function StatusChip({
  status,
  size = 'md',
  showLabel = true,
  swedish = false,
  className = '',
}: StatusChipProps) {
  if (!status) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--color-frost-dim)]/10 text-[var(--color-frost-dim)] border border-dashed border-[var(--color-frost-dim)]/30 ${getSizeClasses(size)} ${className}`}
      >
        <span className="text-xs">—</span>
        {showLabel && <span>{swedish ? 'Ingen data' : 'No Data'}</span>}
      </span>
    );
  }

  const config = STATUS_CONFIG[status];
  const label = swedish ? config.labelSv : config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all ${getSizeClasses(size)} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        boxShadow: status === 'safe' ? config.glowColor.replace('0.3', '0.2') + ' 0 0 12px' : 'none',
      }}
    >
      <span className={status === 'safe' ? 'animate-pulse' : ''}>{config.icon}</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}

function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs';
    case 'md':
      return 'px-3 py-1 text-sm';
    case 'lg':
      return 'px-4 py-1.5 text-base';
  }
}

// Clickable status filter chip
interface StatusFilterChipProps {
  status: IceStatus;
  active: boolean;
  onClick: () => void;
  count?: number;
}

export function StatusFilterChip({
  status,
  active,
  onClick,
  count,
}: StatusFilterChipProps) {
  const config = STATUS_CONFIG[status];

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium 
        transition-all duration-200 border ${
          active
            ? 'border-transparent'
            : 'border-[var(--color-frost-dim)]/30 hover:border-[var(--color-frost-dim)]/50'
        }`}
      style={{
        backgroundColor: active ? config.bgColor : 'transparent',
        color: active ? config.color : 'var(--color-frost-muted)',
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.5 rounded-full text-xs ${
            active ? 'bg-white/20' : 'bg-[var(--color-bg-elevated)]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

