import { useState } from 'react';
import { useFilters } from '@/hooks/useFilters';
import { StatusFilterChip } from './StatusChip';
import type { IceStatus, FilterState } from '@/types';

const ALL_STATUSES: IceStatus[] = ['safe', 'uncertain', 'warning', 'no_ice'];

const SORT_OPTIONS: { value: FilterState['sortBy']; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'reports', label: 'Most Reports' },
];

interface FilterBarProps {
  lakeCounts?: Record<IceStatus, number>;
}

export function FilterBar({ lakeCounts }: FilterBarProps) {
  const {
    filters,
    setSearchQuery,
    setSortBy,
    toggleSortOrder,
    toggleStatusFilter,
    isStatusActive,
    resetFilters,
    activeFilterCount,
  } = useFilters();

  const [showSortDropdown, setShowSortDropdown] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-frost-dim)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search lakes..."
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-bg-deep)] 
            border border-[var(--color-frost-dim)]/20 text-[var(--color-frost-white)]
            placeholder:text-[var(--color-frost-dim)] focus:outline-none 
            focus:border-[var(--color-ice-primary)]/50 focus:ring-1 focus:ring-[var(--color-ice-primary)]/20
            transition-all"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-frost-dim)] hover:text-[var(--color-frost-white)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((status) => (
          <StatusFilterChip
            key={status}
            status={status}
            active={isStatusActive(status)}
            onClick={() => toggleStatusFilter(status)}
            count={lakeCounts?.[status]}
          />
        ))}
      </div>

      {/* Sort and reset */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              text-[var(--color-frost-muted)] hover:text-[var(--color-frost-white)]
              hover:bg-[var(--color-bg-elevated)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>{SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute top-full left-0 mt-1 py-1 rounded-lg bg-[var(--color-bg-elevated)] 
                border border-[var(--color-frost-dim)]/20 shadow-lg z-20 min-w-[160px]">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      filters.sortBy === option.value
                        ? 'text-[var(--color-ice-primary)] bg-[var(--color-ice-primary)]/10'
                        : 'text-[var(--color-frost-muted)] hover:text-[var(--color-frost-white)] hover:bg-[var(--color-bg-surface)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort order toggle */}
          <button
            onClick={toggleSortOrder}
            className="p-1.5 rounded-lg text-[var(--color-frost-muted)] 
              hover:text-[var(--color-frost-white)] hover:bg-[var(--color-bg-elevated)] transition-all"
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Reset filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-2 py-1 rounded text-xs text-[var(--color-frost-muted)] 
                hover:text-[var(--color-frost-white)] transition-colors"
            >
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

