"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard Overview",
      href: "/admin",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: "Board Workspaces",
      href: "/",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white p-5 md:flex">
      {/* Brand Logo & Header */}
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-md shadow-slate-900/10">
          K
        </div>
        <div>
          <h2 className="font-bold tracking-tight text-slate-900 text-sm">Kanban Board</h2>
          <p className="text-xs font-semibold text-sky-600">Admin Console</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="mt-8 flex-1 space-y-1.5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile Footer */}
      <div className="mt-auto rounded-xl border border-slate-100 bg-slate-50 p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 font-bold text-xs">
            {userName ? userName.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">{userName || "Administrator"}</p>
            <p className="truncate text-[11px] text-slate-500">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
