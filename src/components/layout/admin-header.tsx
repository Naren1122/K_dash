"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition">
            Kanban
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Admin Console</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System Health Status */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-emerald-700 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Normal</span>
        </div>

        {/* User Role Badge */}
        <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
          ADMIN
        </span>

        {/* Sign Out Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login?message=signed_out" })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
