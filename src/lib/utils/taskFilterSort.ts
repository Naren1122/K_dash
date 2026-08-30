import type { BoardTask } from "@/lib/types/types";
import { comparePriorities } from "@/lib/utils/priority";
import { getDueDateStatus } from "@/lib/utils/dueDate";

export type DueDateFilterOption = "all" | "overdue" | "upcoming_48h" | "this_week" | "this_month" | "no_date";
export type SortOption = "priority_desc" | "priority_asc" | "due_date_asc" | "due_date_desc" | "title_asc" | "created_desc";

export type FilterSortOptions = {
  selectedLabelIds: string[];
  dueDateFilter: DueDateFilterOption;
  sortBy: SortOption;
};

/**
 * Filter board tasks based on multi-select labels and due date status.
 */
export function filterTasks(tasks: BoardTask[], options: Partial<FilterSortOptions>): BoardTask[] {
  const { selectedLabelIds = [], dueDateFilter = "all" } = options;

  return tasks.filter((task) => {
    // 1. Label filter (must contain ALL selected labels if any are selected)
    if (selectedLabelIds.length > 0) {
      const taskLabelIds = new Set(task.labels.map((l: { id: string }) => l.id));
      const matchesLabels = selectedLabelIds.every((id) => taskLabelIds.has(id));
      if (!matchesLabels) return false;
    }

    // 2. Due date filter
    if (dueDateFilter !== "all") {
      const status = getDueDateStatus(task.dueDate);
      if (dueDateFilter === "overdue" && status !== "overdue") return false;
      if (dueDateFilter === "upcoming_48h" && status !== "upcoming_48h") return false;
      if (dueDateFilter === "no_date" && task.dueDate !== null) return false;

      if (dueDateFilter === "this_week") {
        if (!task.dueDate) return false;
        const target = new Date(task.dueDate);
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (target < startOfWeek || target >= endOfWeek) return false;
      }

      if (dueDateFilter === "this_month") {
        if (!task.dueDate) return false;
        const target = new Date(task.dueDate);
        const now = new Date();
        if (target.getFullYear() !== now.getFullYear() || target.getMonth() !== now.getMonth()) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Sort board tasks according to the chosen sort option.
 */
export function sortTasks(tasks: BoardTask[], sortBy: SortOption = "priority_desc"): BoardTask[] {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "priority_desc":
        return comparePriorities(a.priority, b.priority, false);

      case "priority_asc":
        return comparePriorities(a.priority, b.priority, true);

      case "due_date_asc": {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1; // tasks without due dates go to the bottom
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      case "due_date_desc": {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }

      case "title_asc":
        return a.title.localeCompare(b.title);

      case "created_desc":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}
