"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
          <Link
            href="/"
            className="group mb-2.5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 hover:shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Back to Board</span>
          </Link>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Tasks</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold">
              📊
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{metrics.total}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{completionRate}% completed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Progress (WIP)</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 text-xs font-bold">
              ⚡
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{metrics.inProgress}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Active tasks being worked on</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed Tasks</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-bold">
              ✓
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{metrics.done}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Finished throughput</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Overdue Tasks</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 text-xs font-bold">
              🚨
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{metrics.overdue}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Passed target due date</p>
        </div>
      </div>

      {/* Visual Distributions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Status Distribution</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Breakdown of tasks by status column</p>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                <span>To Do ({metrics.todo})</span>
                <span className="font-bold text-slate-600 dark:text-slate-400">{metrics.total > 0 ? Math.round((metrics.todo / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.total > 0 ? (metrics.todo / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                <span>In Progress ({metrics.inProgress})</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{metrics.total > 0 ? Math.round((metrics.inProgress / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.total > 0 ? (metrics.inProgress / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                <span>Done ({metrics.done})</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{metrics.total > 0 ? Math.round((metrics.done / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.total > 0 ? (metrics.done / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Priority Distribution</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Breakdown of tasks by priority level</p>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                <span>Critical ({metrics.priority.critical})</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{metrics.total > 0 ? Math.round((metrics.priority.critical / metrics.total) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
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
