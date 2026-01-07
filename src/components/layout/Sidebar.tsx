import { useState } from 'react';
import { useFilteredLakes, useIceStore } from '@/stores/iceStore';
import { FilterBar } from '@/components/ui/FilterBar';
import { LakeCard } from '@/components/ui/LakeCard';
import type { IceStatus } from '@/types';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const filteredLakes = useFilteredLakes();
  const lakes = useIceStore((state) => state.lakes);
  const hoveredLakeId = useIceStore((state) => state.hoveredLakeId);
  const setHoveredLakeId = useIceStore((state) => state.setHoveredLakeId);

  // Count lakes by status
  const lakeCounts = lakes.reduce(
    (acc, lake) => {
      if (lake.status) {
        acc[lake.status] = (acc[lake.status] || 0) + 1;
      }
      return acc;
    },
    {} as Record<IceStatus, number>
  );

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}
    >
      <div className="h-full glass border-r border-[var(--color-frost-dim)]/10 flex flex-col">
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 w-6 h-6 rounded-full 
            bg-[var(--color-bg-elevated)] border border-[var(--color-frost-dim)]/20
            flex items-center justify-center text-[var(--color-frost-muted)]
            hover:text-[var(--color-frost-white)] transition-colors z-10"
        >
          <svg
            className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {isCollapsed ? (
          // Collapsed state - just icons
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-6 h-6 rounded bg-[var(--color-ice-primary)]/20 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--color-ice-primary)]">
                {filteredLakes.length}
              </span>
            </div>
          </div>
        ) : (
          // Expanded state
          <>
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-frost-dim)]/10">
              <h2 className="text-sm font-semibold text-[var(--color-frost-white)]">
                Lakes & Ice Status
              </h2>
              <p className="text-xs text-[var(--color-frost-muted)] mt-1">
                {filteredLakes.length} of {lakes.length} lakes
              </p>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-[var(--color-frost-dim)]/10">
              <FilterBar lakeCounts={lakeCounts} />
            </div>

            {/* Lake list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredLakes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-[var(--color-frost-muted)]">
                    No lakes match your filters
                  </p>
                </div>
              ) : (
                filteredLakes.map((lake) => (
                  <LakeCard
                    key={lake.id}
                    lake={lake}
                    onHover={setHoveredLakeId}
                    isHovered={lake.id === hoveredLakeId}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--color-frost-dim)]/10">
              <p className="text-xs text-[var(--color-frost-dim)] text-center">
                Data from{' '}
                <a
                  href="https://sites.google.com/view/isarna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-ice-primary)] hover:underline"
                >
                  Stockholm Municipality
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

