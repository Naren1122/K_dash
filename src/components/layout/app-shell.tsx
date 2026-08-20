"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
  const isAdmin = user.role === "ADMIN";

  const navItems = [
    {
      name: "Board Workspaces",
      href: "/",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      {/* Mobile Backdrop */}
      {mobileMenuOpen ? (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md md:hidden"
        />
      ) : null}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white p-4 transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-xs">
              K
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold tracking-tight text-slate-900 dark:text-white text-sm truncate">Kanban Board</h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                Workspace
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 flex-1 space-y-1">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
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
                        ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                        : isRestricted
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
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
        <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                isAdmin
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-700 text-white shadow-xs"
              }`}
            >
              {getInitials(user.name, user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                {user.name || "Signed-in user"}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email || ""}</p>
            </div>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                isAdmin
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800"
                  : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="md:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 md:px-8">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-600 md:hidden shrink-0 cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-0">
              <span className="hidden sm:inline">Kanban</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-slate-900 dark:text-white font-bold truncate max-w-[140px] sm:max-w-none">{getPageTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* System Status Pulse */}
            <div className="hidden items-center gap-2 rounded-full border border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:from-emerald-950/70 dark:to-teal-950/70 dark:text-emerald-300 md:flex shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Operational</span>
            </div>

            {/* Role Badge */}
            <span
              className={`rounded-lg px-2.5 py-1 text-[11px] sm:text-xs font-bold shadow-2xs ${
                isAdmin
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                  : "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
              }`}
            >
              {user.role}
            </span>

            {/* Sign Out Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login?message=signed_out" })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-rose-950/40 dark:hover:border-rose-800 dark:hover:text-rose-300 focus:outline-none cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        {children}
      </div>
    </div>
  );
}
