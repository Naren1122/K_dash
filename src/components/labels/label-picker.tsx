"use client";

import type { Label } from "@/lib/types/types";

type LabelPickerProps = {
  labels: Label[];
  selected: string[];
  onToggle: (labelId: string) => void;
};

export function LabelPicker({ labels, selected, onToggle }: LabelPickerProps) {
  if (labels.length === 0) {
    return (
      <p className="mt-1.5 text-xs italic text-slate-400 dark:text-slate-500">
        No labels yet. An admin can create them.
      </p>
    );
  }

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Labels">
      {labels.map((label) => {
        const isSelected = selected.includes(label.id);
        return (
          <button
            key={label.id}
            aria-pressed={isSelected}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${isSelected
                ? "border-transparent text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            onClick={() => onToggle(label.id)}
            style={isSelected ? { backgroundColor: label.color } : undefined}
            type="button"
          >
            {label.name}
          </button>
        );
      })}
    </div>
  );
}