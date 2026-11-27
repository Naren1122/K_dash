import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-20 dark:bg-slate-950 sm:pt-40 sm:pb-28">
      {/* Background gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-br from-sky-100 via-blue-50 to-transparent opacity-70 blur-3xl dark:from-sky-900/20 dark:via-blue-900/10"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            Role-based · Real-time · Invite-only
          </span>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Your team&apos;s work,{" "}
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
              beautifully organised
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            K-Dash is a modern Kanban board with drag-and-drop, priorities, due dates, labels,
            and role-based access — built for teams that care about focus.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] hover:shadow-sky-500/40 sm:w-auto"
            >
              Start for free →
            </Link>
            <a
              href="#how-it-works"
              className="w-full rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Mock board screenshot */}
        <div className="mt-20 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
          <div className="rounded-xl bg-white dark:bg-slate-800 p-4 sm:p-6">
            {/* Fake toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="h-5 w-32 rounded-md bg-slate-100 dark:bg-slate-700" />
              <div className="h-7 w-20 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 opacity-80" />
            </div>
            {/* Fake columns */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "To Do", color: "bg-slate-200 dark:bg-slate-700", cards: 3 },
                { label: "In Progress", color: "bg-sky-100 dark:bg-sky-900/30", cards: 2 },
                { label: "Done", color: "bg-green-100 dark:bg-green-900/30", cards: 4 },
              ].map((col) => (
                <div key={col.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {col.label}
                    </span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      {col.cards}
                    </span>
                  </div>
                  {Array.from({ length: col.cards }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-lg ${col.color} p-3`}
                    >
                      <div className="mb-2 h-3 rounded bg-slate-300/60 dark:bg-slate-600/60" style={{ width: `${60 + i * 12}%` }} />
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-10 rounded bg-sky-200 dark:bg-sky-700/60" />
                        <div className="h-4 w-8 rounded bg-purple-200 dark:bg-purple-700/60" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
