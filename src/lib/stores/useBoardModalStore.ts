import { create } from "zustand";

interface BoardModalState {
  isCreateFormOpen: boolean;
  viewingTaskId: string | null;
  deletingTaskId: string | null;

  // Actions
  openCreateForm: () => void;
  closeCreateForm: () => void;
  toggleCreateForm: () => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
  openDeleteConfirm: (taskId: string) => void;
  closeDeleteConfirm: () => void;
}

export const useBoardModalStore = create<BoardModalState>((set) => ({
  isCreateFormOpen: false,
  viewingTaskId: null,
  deletingTaskId: null,

  openCreateForm: () => set({ isCreateFormOpen: true }),
  closeCreateForm: () => set({ isCreateFormOpen: false }),
  toggleCreateForm: () => set((state) => ({ isCreateFormOpen: !state.isCreateFormOpen })),

  openTaskDetail: (taskId: string) => set({ viewingTaskId: taskId }),
  closeTaskDetail: () => set({ viewingTaskId: null }),

  openDeleteConfirm: (taskId: string) => set({ deletingTaskId: taskId }),
  closeDeleteConfirm: () => set({ deletingTaskId: null }),
}));
