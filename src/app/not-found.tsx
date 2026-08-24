import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
        <FileQuestion className="h-8 w-8" aria-hidden="true" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
        Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400">
        Sorry, we couldn&apos;t find the page or task you were looking for. It might have been moved or deleted.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/board"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Board
        </Link>
      </div>
    </div>
  );
}
