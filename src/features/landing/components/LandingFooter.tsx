import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 font-black text-sm text-white">
              K
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">K-Dash</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {["Features", "How it works"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200"
              >
                {item}
              </a>
            ))}
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200"
            >
              Sign in
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} K-Dash. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
