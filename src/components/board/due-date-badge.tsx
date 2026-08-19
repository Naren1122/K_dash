import { Badge } from "@/components/ui/badge";
import { dueDateInfo } from "@/components/board/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatDateFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
}

export function DueDateBadge({ dueDate }: { dueDate: string | null }) {
  const info = dueDateInfo(dueDate);
  if (!info) return null;

  const dateLabel = formatDate(dueDate!);

  const toneClass =
    info.tone === "overdue"
      ? "bg-red-100 text-red-700"
      : info.tone === "upcoming"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-slate-100 text-slate-600";

  const dotClass =
    info.tone === "overdue"
      ? "bg-red-500"
      : info.tone === "upcoming"
        ? "bg-yellow-500"
        : "bg-slate-400";

  return (
    <Badge className={toneClass} title={`${info.label}: ${formatDateFull(dueDate!)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {dateLabel}
    </Badge>
  );
}