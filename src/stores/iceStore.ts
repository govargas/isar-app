import { create } from 'zustand';
import type { LakeWithStatus, FilterState, IceStatus, MapViewState } from '@/types';
import { INITIAL_VIEW_STATE } from '@/lib/constants';

interface IceStore {
  // Lake data
  lakes: LakeWithStatus[];
  selectedLake: LakeWithStatus | null;
  hoveredLakeId: string | null;
  loading: boolean;
  error: string | null;

  // Map state
  viewState: MapViewState;

  // Filter state
  filters: FilterState;

  // Actions
  setLakes: (lakes: LakeWithStatus[]) => void;
  updateLake: (lake: LakeWithStatus) => void;
  setSelectedLake: (lake: LakeWithStatus | null) => void;
  setHoveredLakeId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setViewState: (viewState: MapViewState) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  toggleStatusFilter: (status: IceStatus) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  status: [],
  sortBy: 'name',
  sortOrder: 'asc',
  searchQuery: '',
};

export const useIceStore = create<IceStore>((set) => ({
  // Initial state
  lakes: [],
  selectedLake: null,
  hoveredLakeId: null,
  loading: false,
  error: null,
  viewState: INITIAL_VIEW_STATE,
  filters: initialFilters,

  // Actions
  setLakes: (lakes) => set({ lakes }),

  updateLake: (updatedLake) =>
    set((state) => ({
      lakes: state.lakes.map((lake) =>
        lake.id === updatedLake.id ? updatedLake : lake
      ),
      selectedLake:
        state.selectedLake?.id === updatedLake.id
          ? updatedLake
          : state.selectedLake,
    })),

  setSelectedLake: (lake) => set({ selectedLake: lake }),

  setHoveredLakeId: (id) => set({ hoveredLakeId: id }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setViewState: (viewState) => set({ viewState }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  toggleStatusFilter: (status) =>
    set((state) => {
      const currentStatuses = state.filters.status;
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];
      return {
        filters: { ...state.filters, status: newStatuses },
      };
    }),

  resetFilters: () => set({ filters: initialFilters }),
}));

// Selectors
export const useFilteredLakes = () => {
  const lakes = useIceStore((state) => state.lakes);
  const filters = useIceStore((state) => state.filters);

  return lakes.filter((lake) => {
    // Filter by status
    if (filters.status.length > 0 && lake.status) {
      if (!filters.status.includes(lake.status)) {
        return false;
      }
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (
        !lake.name.toLowerCase().includes(query) &&
        !lake.region?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const order = filters.sortOrder === 'asc' ? 1 : -1;

    switch (filters.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * order;
      case 'status':
        const statusOrder = { safe: 1, uncertain: 2, warning: 3, no_ice: 4 };
        const aOrder = a.status ? statusOrder[a.status] : 5;
        const bOrder = b.status ? statusOrder[b.status] : 5;
        return (aOrder - bOrder) * order;
      case 'updated':
        const aDate = a.last_updated ? new Date(a.last_updated).getTime() : 0;
        const bDate = b.last_updated ? new Date(b.last_updated).getTime() : 0;
        return (bDate - aDate) * order;
      case 'reports':
        return (b.recent_report_count - a.recent_report_count) * order;
      default:
        return 0;
    }
  });
};

