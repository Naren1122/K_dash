"use client";

import Link from "next/link";

type TaskExport = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: string;
  creator: string;
  createdAt: string;
};

type AnalyticsData = {
  metrics: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
    priority: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  tasks: TaskExport[];
};

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const { metrics } = data;

  const completionRate = metrics.total > 0 ? Math.round((metrics.done / metrics.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← Back to Board
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Analytics & Reports
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Insights on task throughput, status breakdown, and priority distribution.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Tasks</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{metrics.total}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{completionRate}% completed</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">In Progress (WIP)</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">{metrics.inProgress}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Active tasks being worked on</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Completed Tasks</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{metrics.done}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Finished throughput</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Overdue Tasks</p>
          <p className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-400">{metrics.overdue}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Passed target due date</p>
        </div>
      </div>

      {/* Visual Distributions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Status Distribution</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Breakdown of tasks by status column</p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>To Do ({metrics.todo})</span>
                <span>{metrics.total > 0 ? Math.round((metrics.todo / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{ width: `${metrics.total > 0 ? (metrics.todo / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>In Progress ({metrics.inProgress})</span>
                <span>{metrics.total > 0 ? Math.round((metrics.inProgress / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${metrics.total > 0 ? (metrics.inProgress / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>Done ({metrics.done})</span>
                <span>{metrics.total > 0 ? Math.round((metrics.done / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${metrics.total > 0 ? (metrics.done / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Priority Distribution</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Breakdown of tasks by priority level</p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>Critical ({metrics.priority.critical})</span>
                <span>{metrics.total > 0 ? Math.round((metrics.priority.critical / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${metrics.total > 0 ? (metrics.priority.critical / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>High ({metrics.priority.high})</span>
                <span>{metrics.total > 0 ? Math.round((metrics.priority.high / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${metrics.total > 0 ? (metrics.priority.high / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>Medium ({metrics.priority.medium})</span>
                <span>{metrics.total > 0 ? Math.round((metrics.priority.medium / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${metrics.total > 0 ? (metrics.priority.medium / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span>Low ({metrics.priority.low})</span>
                <span>{metrics.total > 0 ? Math.round((metrics.priority.low / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{ width: `${metrics.total > 0 ? (metrics.priority.low / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
