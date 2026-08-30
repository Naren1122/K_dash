import Link from "next/link";
import { auth } from "@/auth";

export default async function ForbiddenPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9ff] dark:bg-[#090d16] p-6 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-8 sm:p-10 shadow-2xl shadow-slate-900/5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <span className="mt-6 inline-block rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase border border-amber-200 dark:border-amber-800">
          Error 403 • Access Restricted
        </span>

        <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Administrative Privileges Required
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          You do not have permission to view the System Administration console. This area is strictly reserved for users with the <span className="font-bold text-slate-900 dark:text-white">ADMIN</span> role.
        </p>

        {session?.user ? (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40 p-4 text-xs text-left">
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Current Session</p>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{session.user.name || session.user.email}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{session.user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
              Role: {session.user.role}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/board"
            className="flex-1 rounded-xl bg-slate-950 px-5 py-3 text-center text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Back to Board
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </main>
  );
}
