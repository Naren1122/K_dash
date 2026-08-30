"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/utils/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("root_global_error", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col items-center justify-center bg-slate-50 p-6 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <div className="max-w-md w-full rounded-2xl border border-red-200/80 bg-white p-8 shadow-xl shadow-red-500/5 dark:border-red-900/40 dark:bg-slate-900 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Application Error
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            A critical error occurred that prevented the application from rendering.
          </p>

          <div className="mt-6">
            <button
              onClick={() => reset()}
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
