import type { Label } from "@/types/types";

export function LabelPill({ label }: { label: Label }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white"
      style={{ backgroundColor: label.color }}
    >
      {label.name}
    </span>
  );
}