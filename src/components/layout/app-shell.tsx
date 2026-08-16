"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";

type Role = "ADMIN" | "MEMBER";

interface AppShellProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: Role;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAdmin = user.role === "ADMIN";

  const navItems = [
    {
      name: "Board Workspaces",
      href: "/",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      badge: null,
    },
    ...(isAdmin
      ? [
          {
            name: "Dashboard Overview",
            href: "/admin",
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            ),
            badge: "Admin",
          },
        ]
      : []),
  ];

  const getPageTitle = () => {
    if (pathname.startsWith("/admin")) return "Admin Console";
    return "Board Workspaces";
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return (email || "U").charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mobile Backdrop */}
      {mobileMenuOpen ? (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
        />
      ) : null}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-slate-200/80 bg-white p-5 transition-all duration-200 ${sidebarCollapsed ? "md:w-20" : ""} md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white font-black shadow-md shadow-slate-950/10">
              K
            </div>
            <div>
              <h2 className="font-bold tracking-tight text-slate-900 text-sm">Kanban Board</h2>
              <p className="text-xs font-semibold text-sky-600">Enterprise Workspace</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-8 flex-1 space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isRestricted = item.href === "/admin" && !isAdmin;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isRestricted
                        ? "bg-amber-100 text-amber-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Summary Footer */}
        <div className="mt-auto rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-xs ${
                isAdmin
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-sky-100 text-sky-700 border border-sky-200"
              }`}
            >
              {getInitials(user.name, user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">
                {user.name || "Signed-in user"}
              </p>
              <p className="truncate text-[11px] text-slate-500">{user.email || ""}</p>
            </div>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                isAdmin
                  ? "bg-purple-100 text-purple-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>
        <button aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 md:flex" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} type="button">{sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}</button>
      </aside>

      {/* Main Container */}
      <div className={`transition-[padding] duration-200 ${sidebarCollapsed ? "md:pl-20" : "md:pl-64"}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-6 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Kanban</span>
              <span>/</span>
              <span className="text-slate-900 font-bold">{getPageTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* System Status Pulse */}
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Operational</span>
            </div>

            {/* Role Badge */}
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                isAdmin
                  ? "bg-purple-100 text-purple-800"
                  : "bg-sky-100 text-sky-800"
              }`}
            >
              {user.role}
            </span>

            {/* Sign Out Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login?message=signed_out" })}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        {children}
      </div>
    </div>
  );
}
