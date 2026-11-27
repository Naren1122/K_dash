"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface BoardPaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BoardPaginationBar({
  currentPage,
  totalPages,
  onPageChange,
}: BoardPaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-6 pb-2">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
        aria-label="Previous Page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
        aria-label="Next Page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
