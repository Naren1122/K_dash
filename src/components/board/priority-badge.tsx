import { Badge } from "@/components/ui/badge";
import type { PriorityValue } from "@/lib/schemas/tasksSchema";

const priorityMeta: Record<PriorityValue, { label: string; badge: string; dot: string }> = {
  LOW: { label: "Low", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  MEDIUM: { label: "Medium", badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
  HIGH: { label: "High", badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
  CRITICAL: { label: "Critical", badge: "bg-red-100 text-red-700", dot: "bg-red-600" },
};

export function PriorityBadge({ priority }: { priority: PriorityValue }) {
  const meta = priorityMeta[priority];
  return (
    <Badge className={meta.badge}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </Badge>
  );
}

export const PRIORITY_OPTIONS = Object.entries(priorityMeta).map(([value, meta]) => ({
  value: value as PriorityValue,
  label: meta.label,
}));