import type { TaskStatusValue } from "@/lib/schemas/tasksSchema";

export interface ColumnDefinition {
  status: TaskStatusValue;
  label: string;
  accent: string;
  soft: string;
  border: string;
  subtitle: string;
}

export const columns: ColumnDefinition[] = [
  {
    status: "TODO",
    label: "To do",
    subtitle: "Ready when you are",
    accent: "bg-sky-500",
    soft: "bg-sky-50/60",
    border: "border-sky-200/80",
  },
  {
    status: "IN_PROGRESS",
    label: "In progress",
    subtitle: "Work in motion",
    accent: "bg-amber-500",
    soft: "bg-amber-50/60",
    border: "border-amber-200/80",
  },
  {
    status: "DONE",
    label: "Done",
    subtitle: "Completed work",
    accent: "bg-emerald-500",
    soft: "bg-emerald-50/60",
    border: "border-emerald-200/80",
  },
];

export const statusLabels: Record<TaskStatusValue, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};
