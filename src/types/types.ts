import type { TaskStatusValue, PriorityValue } from "@/lib/schemas/tasksSchema";

export type Assignee = { id: string; name: string | null; email: string };

export type Label = { id: string; name: string; color: string };

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: Assignee;
};

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusValue;
  priority: PriorityValue;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: Assignee | null;
  labels: Label[];
  comments: Comment[];
};

export const columns: Array<{
  status: TaskStatusValue;
  label: string;
  accent: string;
  soft: string;
  border: string;
  subtitle: string;
}> = [
  { status: "TODO", label: "To do", subtitle: "Ready when you are", accent: "bg-sky-500", soft: "bg-sky-50/60", border: "border-sky-200/80" },
  { status: "IN_PROGRESS", label: "In progress", subtitle: "Work in motion", accent: "bg-amber-500", soft: "bg-amber-50/60", border: "border-amber-200/80" },
  { status: "DONE", label: "Done", subtitle: "Completed work", accent: "bg-emerald-500", soft: "bg-emerald-50/60", border: "border-emerald-200/80" },
];

export const statusLabels: Record<TaskStatusValue, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

import { getDueDateStatus } from "@/utils/dueDate";

export function dueDateInfo(dueDate: string | null) {
  const status = getDueDateStatus(dueDate);
  if (status === "none") return null;
  if (status === "overdue") {
    return { tone: "overdue", label: "Overdue" } as const;
  }
  if (status === "upcoming_48h") {
    return { tone: "upcoming", label: "Due soon" } as const;
  }
  return { tone: "ok", label: "Due" } as const;
}


export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}