export type DueDateStatus = "overdue" | "upcoming_48h" | "future" | "none";

/**
 * Returns the status category of a due date relative to now (UTC comparison).
 */
export function getDueDateStatus(dueDate: Date | string | null | undefined): DueDateStatus {
  if (!dueDate) return "none";

  const target = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (isNaN(target.getTime())) return "none";

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs < 0) {
    // If it's earlier today or past, check if date is strictly before start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (target.getTime() < startOfToday.getTime()) {
      return "overdue";
    }
  }

  // Due within 48 hours (172,800,000 ms)
  if (diffMs >= 0 && diffMs <= 48 * 60 * 60 * 1000) {
    return "upcoming_48h";
  }

  return "future";
}

/**
 * Format date nicely in local timezone format (e.g. "Oct 24" or "Oct 24, 2026")
 */
export function formatLocalDate(dueDate: Date | string | null | undefined): string {
  if (!dueDate) return "";
  const target = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (isNaN(target.getTime())) return "";

  const now = new Date();
  const showYear = target.getFullYear() !== now.getFullYear();

  return target.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(showYear ? { year: "numeric" } : {}),
  });
}

/**
 * Converts an ISO string or Date to YYYY-MM-DD format for HTML date inputs.
 */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

