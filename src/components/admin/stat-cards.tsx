interface StatCardsProps {
  totalUsers: number;
  adminCount: number;
  memberCount: number;
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
}

export function StatCards({
  totalUsers,
  adminCount,
  memberCount,
  totalTasks,
  todoCount,
  inProgressCount,
  doneCount,
}: StatCardsProps) {
  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const stats = [
    {
      title: "Total Workspace Users",
      value: totalUsers.toString(),
      subtext: `${adminCount} Admin • ${memberCount} Members`,
      badge: "Active",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      icon: (
        <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: "Total Board Tasks",
      value: totalTasks.toString(),
      subtext: `${todoCount} Todo • ${inProgressCount} In Progress`,
      badge: `${doneCount} Done`,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: (
        <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: "Task Completion Rate",
      value: `${completionRate}%`,
      subtext: `${doneCount} out of ${totalTasks} completed`,
      badge: "Efficiency",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: (
        <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: "RBAC Route Guard",
      value: "Protected",
      subtext: "Strict Role: ADMIN required",
      badge: "Enforced",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      icon: (
        <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.title}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-700 dark:bg-slate-800">
              {stat.icon}
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value}</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${stat.badgeColor}`}
            >
              {stat.badge}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stat.subtext}</p>
        </div>
      ))}
    </div>
  );
}
