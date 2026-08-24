"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export interface ErrorFallbackProps {
  error?: Error | null;
  reset?: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this section. Please try again or return to the dashboard.",
  showHomeButton = true,
}: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-[320px] w-full flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-red-200/80 bg-white p-6 shadow-xl shadow-red-500/5 dark:border-red-900/40 dark:bg-slate-900 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {error?.message || description}
        </p>

        {isDev && error?.stack && (
          <div className="mt-4 max-h-36 overflow-auto rounded-lg bg-slate-100 p-3 text-left font-mono text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {error.stack}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          {reset && (
            <button
              onClick={reset}
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          )}

          {showHomeButton && (
            <Link
              href="/board"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go to Board
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
