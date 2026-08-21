import type { PriorityValue as Priority } from "@/lib/schemas/tasksSchema";

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; dot: string }> = {
  CRITICAL: {
    bg: "bg-red-50 border-red-200/80",
    text: "text-red-700 font-bold",
    dot: "bg-red-500",
  },
  HIGH: {
    bg: "bg-amber-50 border-amber-200/80",
    text: "text-amber-700 font-semibold",
    dot: "bg-amber-500",
  },
  MEDIUM: {
    bg: "bg-blue-50 border-blue-200/80",
    text: "text-blue-700 font-medium",
    dot: "bg-blue-500",
  },
  LOW: {
    bg: "bg-slate-100 border-slate-200/80",
    text: "text-slate-600 font-medium",
    dot: "bg-slate-400",
  },
};

/**
 * Compare two priorities for sorting (descending: CRITICAL first, LOW last)
 */
export function comparePriorities(a: Priority, b: Priority, ascending = false): number {
  const weightA = PRIORITY_WEIGHTS[a] ?? 0;
  const weightB = PRIORITY_WEIGHTS[b] ?? 0;
  return ascending ? weightA - weightB : weightB - weightA;
}
