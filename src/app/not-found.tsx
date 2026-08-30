import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-8 sm:p-10 shadow-2xl shadow-slate-900/5">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-xs">
          <FileQuestion className="h-8 w-8" aria-hidden="true" />
        </div>

        <span className="inline-block rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase border border-slate-200 dark:border-slate-700">
          Error 404 • Resource Not Found
        </span>

        <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Page or Task Not Found
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          The task board, workspace view, or item you are looking for does not exist or has been moved.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/board"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            <Home className="h-4 w-4" />
            Back to Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
