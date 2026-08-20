"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  function getPageNumbers() {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }
    if (safePage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  }

  const pages = getPageNumbers();

  const startItem = pageSize ? (safePage - 1) * pageSize + 1 : null;
  const endItem = pageSize && totalItems ? Math.min(safePage * pageSize, totalItems) : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
      {totalItems !== undefined && startItem !== null && endItem !== null ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startItem}</span> to{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{endItem}</span> of{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> items
        </p>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page buttons */}
        {pages.map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition cursor-pointer ${
                safePage === p
                  ? "bg-slate-900 text-white shadow-xs dark:bg-sky-600"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
              ...
            </span>
          )
        )}

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
