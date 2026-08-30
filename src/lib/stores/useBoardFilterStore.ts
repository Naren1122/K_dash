import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DueDateFilterOption, SortOption } from "@/lib/utils/taskFilterSort";

export type ActiveBoardView = "kanban" | "list" | "calendar" | "timeline";

interface BoardFilterState {
  activeView: ActiveBoardView;
  selectedLabelIds: string[];
  dueDateFilter: DueDateFilterOption;
  sortBy: SortOption;
  currentPage: number;
  pageSize: number;
  isHydrated: boolean;

  // Actions
  setActiveView: (view: ActiveBoardView) => void;
  toggleLabelFilter: (labelId: string) => void;
  clearLabelFilters: () => void;
  setDueDateFilter: (option: DueDateFilterOption) => void;
  setSortBy: (option: SortOption) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  setPageSize: (size: number) => void;
  resetFilters: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useBoardFilterStore = create<BoardFilterState>()(
  persist(
    (set) => ({
      activeView: "kanban",
      selectedLabelIds: [],
      dueDateFilter: "all",
      sortBy: "priority_desc",
      currentPage: 1,
      pageSize: 3,
      isHydrated: false,

      setActiveView: (view) =>
        set({
          activeView: view,
          currentPage: 1,
        }),

      toggleLabelFilter: (labelId) =>
        set((state) => ({
          selectedLabelIds: state.selectedLabelIds.includes(labelId)
            ? state.selectedLabelIds.filter((id) => id !== labelId)
            : [...state.selectedLabelIds, labelId],
          currentPage: 1,
        })),

      clearLabelFilters: () =>
        set({
          selectedLabelIds: [],
          currentPage: 1,
        }),

      setDueDateFilter: (dueDateFilter) =>
        set({
          dueDateFilter,
          currentPage: 1,
        }),

      setSortBy: (sortBy) =>
        set({
          sortBy,
          currentPage: 1,
        }),

      setCurrentPage: (pageOrUpdater) =>
        set((state) => ({
          currentPage:
            typeof pageOrUpdater === "function"
              ? pageOrUpdater(state.currentPage)
              : pageOrUpdater,
        })),

      setPageSize: (pageSize) =>
        set({
          pageSize,
          currentPage: 1,
        }),

      resetFilters: () =>
        set({
          selectedLabelIds: [],
          dueDateFilter: "all",
          sortBy: "priority_desc",
          currentPage: 1,
        }),

      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: "kanban_board_filter_storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      })),
      partialize: (state) => ({
        activeView: state.activeView,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
