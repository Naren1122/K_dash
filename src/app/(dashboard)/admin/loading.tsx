export default function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Sidebar Skeleton */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-6 md:block">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-10 space-y-3">
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      </aside>

      {/* Main Content Area Skeleton */}
      <div className="md:pl-64">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </header>

        {/* Dashboard Grid Skeleton */}
        <main className="p-6 md:p-8">
          <div className="mb-8">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
          </div>

          {/* Stat Cards Skeleton */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
                </div>
                <div className="mt-4 h-8 w-16 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />
              <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <div className="space-y-4">
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-slate-50" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-slate-50" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-slate-50" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
