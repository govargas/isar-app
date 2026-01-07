import { useCallback } from 'react';
import { useIceStore, useFilteredLakes } from '@/stores/iceStore';
import type { IceStatus, FilterState } from '@/types';

export function useFilters() {
  const filters = useIceStore((state) => state.filters);
  const setFilters = useIceStore((state) => state.setFilters);
  const toggleStatusFilter = useIceStore((state) => state.toggleStatusFilter);
  const resetFilters = useIceStore((state) => state.resetFilters);
  const filteredLakes = useFilteredLakes();

  const setSearchQuery = useCallback(
    (query: string) => {
      setFilters({ searchQuery: query });
    },
    [setFilters]
  );

  const setSortBy = useCallback(
    (sortBy: FilterState['sortBy']) => {
      setFilters({ sortBy });
    },
    [setFilters]
  );

  const toggleSortOrder = useCallback(() => {
    setFilters({
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  }, [filters.sortOrder, setFilters]);

  const isStatusActive = useCallback(
    (status: IceStatus) => {
      return filters.status.includes(status);
    },
    [filters.status]
  );

  const activeFilterCount = filters.status.length + (filters.searchQuery ? 1 : 0);

  return {
    filters,
    filteredLakes,
    setSearchQuery,
    setSortBy,
    toggleSortOrder,
    toggleStatusFilter,
    isStatusActive,
    resetFilters,
    activeFilterCount,
  };
}

