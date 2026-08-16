import Link from "next/link";
import { auth } from "../../../auth";

export default async function ForbiddenPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600">
          <svg
            className="h-7 w-7"
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

        <span className="mt-6 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold tracking-wide uppercase text-amber-700">
          Error 403 • Forbidden
        </span>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Access Restricted
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          You do not have administrative permissions to view the Admin Dashboard. This area is strictly restricted to users with the <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-800">ADMIN</code> role.
        </p>

        {session?.user ? (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
            <p className="font-semibold text-slate-800">Signed in as:</p>
            <p className="mt-1 font-medium text-slate-900">{session.user.email}</p>
            <p className="mt-0.5 text-slate-500">
              Role: <span className="font-semibold text-amber-600">{session.user.role}</span>
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
          >
            Back to Board
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </main>
  );
}
