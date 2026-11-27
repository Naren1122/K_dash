"use client";

import Link from "next/link";
import { useState } from "react";

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 font-black text-white shadow-sm shadow-sky-500/30">
            K
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            K-Dash
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 md:flex">
          {["Features", "How it works"].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-500/25 transition-opacity hover:opacity-90"
          >
            Get started →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <ul className="flex flex-col gap-3">
            {["Features", "How it works"].map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Get started →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
