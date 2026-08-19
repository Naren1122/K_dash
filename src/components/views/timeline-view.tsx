"use client";

import { useMemo, useState } from "react";
import type { BoardTask } from "@/components/board/types";
import { formatLocalDate, getDueDateStatus } from "@/lib/utils/dueDate";

type ZoomLevel = "day" | "week" | "month";

type TimelineViewProps = {
  tasks: BoardTask[];
  onViewTask: (task: BoardTask) => void;
};

const DAY_MS = 86400000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

const PRIORITY_ACCENTS: Record<string, { stripe: string; bg: string; text: string; tag: string }> = {
  CRITICAL: {
    stripe: "bg-red-500",
    bg: "bg-white border-slate-200/80",
    text: "text-slate-900",
    tag: "🔴 Critical",
  },
  HIGH: {
    stripe: "bg-amber-500",
    bg: "bg-white border-slate-200/80",
    text: "text-slate-900",
    tag: "📙 High",
  },
  MEDIUM: {
    stripe: "bg-violet-500",
    bg: "bg-white border-slate-200/80",
    text: "text-slate-900",
    tag: "🌱 Medium",
  },
  LOW: {
    stripe: "bg-emerald-500",
    bg: "bg-white border-slate-200/80",
    text: "text-slate-900",
    tag: "🔹 Low",
  },
};

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function TimelineView({ tasks, onViewTask }: TimelineViewProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("day");
  const [offsetDays, setOffsetDays] = useState(0);
  const [showDone, setShowDone] = useState(true);

  const dayWidth = zoom === "day" ? 56 : zoom === "week" ? 36 : 24;

  const filteredTasks = useMemo(() => {
    if (showDone) return tasks;
    return tasks.filter((t) => t.status !== "DONE");
  }, [tasks, showDone]);

  const assignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string | null; email: string }>();
    for (const t of tasks) {
      if (t.assignee) {
        map.set(t.assignee.id, t.assignee);
      }
    }
    return Array.from(map.values());
  }, [tasks]);

  const { columns, monthGroups } = useMemo(() => {
    const today = startOfDay(new Date());
    const rs = addDays(today, -7 + offsetDays);
    const numDays = zoom === "month" ? 60 : 35;

    const cols: Date[] = [];
    const monthsMap = new Map<string, { label: string; count: number }>();

    for (let i = 0; i < numDays; i++) {
      const d = addDays(rs, i);
      cols.push(d);

      const mKey = d.toLocaleString(undefined, { month: "long", year: "numeric" });
      const current = monthsMap.get(mKey);
      if (current) {
        current.count += 1;
      } else {
        monthsMap.set(mKey, { label: mKey, count: 1 });
      }
    }

    return {
      rangeStart: rs,
      columns: cols,
      monthGroups: Array.from(monthsMap.values()),
    };
  }, [offsetDays, zoom]);

  const rangeStart = columns[0] ? columns[0] : startOfDay(new Date());
  const today = startOfDay(new Date());
  const todayIndex = columns.findIndex((c) => c.getTime() === today.getTime());

  const { taskLayouts, totalRows } = useMemo(() => {
    const sorted = [...filteredTasks].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const rowEnds: number[] = [];
    const layouts: {
      task: BoardTask;
      row: number;
      leftPx: number;
      widthPx: number;
    }[] = [];

    for (const task of sorted) {
      const created = startOfDay(new Date(task.createdAt));
      const due = task.dueDate ? startOfDay(new Date(task.dueDate)) : addDays(created, 4);

      const startOffset = Math.round((created.getTime() - rangeStart.getTime()) / DAY_MS);
      const duration = Math.max(1, Math.round((due.getTime() - created.getTime()) / DAY_MS) + 1);

      const leftPx = startOffset * dayWidth;
      const widthPx = Math.max(220, duration * dayWidth);
      const rightPx = leftPx + widthPx + 24;

      let rowIndex = 0;
      while (rowIndex < rowEnds.length && rowEnds[rowIndex] > leftPx) {
        rowIndex++;
      }
      rowEnds[rowIndex] = rightPx;

      layouts.push({ task, row: rowIndex, leftPx, widthPx });
    }

    return { taskLayouts: layouts, totalRows: Math.max(4, rowEnds.length) };
  }, [filteredTasks, rangeStart, dayWidth]);

  const dateRangeText = useMemo(() => {
    if (columns.length === 0) return "";
    const first = columns[0];
    const last = columns[columns.length - 1];
    return `${first.getDate()} ${first.toLocaleString(undefined, { month: "short" })} - ${last.getDate()} ${last.toLocaleString(undefined, { month: "short", year: "numeric" })}`;
  }, [columns]);

  const canvasWidth = columns.length * dayWidth;
  const rowHeight = 76;

  return (
    <section aria-label="Timeline View" className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Timeline</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed visual representation of your project&apos;s journey, key milestones, and task schedules.
          </p>
        </div>

        {/* Assignee Avatar Stack */}
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2 overflow-hidden">
            {assignees.slice(0, 4).map((user) => (
              <div
                key={user.id}
                title={user.name || user.email}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 shadow-xs"
              >
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          {assignees.length > 4 ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              +{assignees.length - 4}
            </span>
          ) : null}
        </div>
      </div>

      {/* Control Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Day / Week / Month Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-xs dark:border-slate-800 dark:bg-slate-950">
            {(["day", "week", "month"] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoom(z)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  zoom === z
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {z.charAt(0).toUpperCase() + z.slice(1)}
              </button>
            ))}
          </div>

          {/* Range Picker Navigator */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
            <button
              type="button"
              onClick={() => setOffsetDays((p) => p - (zoom === "day" ? 7 : zoom === "week" ? 14 : 30))}
              className="px-1 text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              aria-label="Previous date range"
            >
              ‹
            </button>
            <span className="px-2 text-[11px] font-semibold text-slate-800 dark:text-slate-200">{dateRangeText}</span>
            <button
              type="button"
              onClick={() => setOffsetDays((p) => p + (zoom === "day" ? 7 : zoom === "week" ? 14 : 30))}
              className="px-1 text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              aria-label="Next date range"
            >
              ›
            </button>
          </div>
        </div>

        {/* Right Toggle Controls */}
        <div className="flex items-center gap-4">
          {/* Show done toggle */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <span>Show done</span>
            <button
              type="button"
              role="switch"
              aria-checked={showDone}
              onClick={() => setShowDone(!showDone)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                showDone ? "bg-slate-900 dark:bg-sky-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  showDone ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Main Timeline Canvas */}
      {tasks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">No tasks found for timeline display.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-50/20 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="relative" style={{ width: canvasWidth }}>
            {/* Tier 1 Header: Months */}
            <div className="flex border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
              {monthGroups.map((m, idx) => (
                <div
                  key={idx}
                  className="border-r border-slate-200/80 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight"
                  style={{ width: m.count * dayWidth }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Tier 2 Header: Days */}
            <div className="flex border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {columns.map((col, i) => {
                const dayLetter = DAY_LETTERS[col.getDay()];
                const dateNum = col.getDate();
                const isWeekend = col.getDay() === 0 || col.getDay() === 6;
                const isToday = col.getTime() === today.getTime();

                return (
                  <div
                    key={i}
                    className={`relative flex flex-col items-center justify-center border-r border-slate-200/50 dark:border-slate-800/80 py-2 text-[11px] ${
                      isWeekend ? "bg-slate-100/60 dark:bg-slate-800/40" : ""
                    }`}
                    style={{ width: dayWidth }}
                  >
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">{dayLetter}</span>
                    <span
                      className={`font-extrabold ${
                        isToday ? "text-violet-600 dark:text-violet-400 text-xs" : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {dateNum}
                    </span>

                    {/* Today indicator header accent line */}
                    {isToday ? (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Timeline Canvas Body */}
            <div className="relative bg-slate-50/20 dark:bg-slate-950/20" style={{ height: totalRows * rowHeight + 30 }}>
              {/* Background Column Grid Lines & Weekend Hatching */}
              <div className="absolute inset-0 flex pointer-events-none">
                {columns.map((col, i) => {
                  const isWeekend = col.getDay() === 0 || col.getDay() === 6;
                  const isToday = col.getTime() === today.getTime();

                  return (
                    <div
                      key={i}
                      className={`border-r border-slate-200/40 dark:border-slate-800/40 h-full ${
                        isWeekend ? "bg-slate-100/40 dark:bg-slate-800/20" : ""
                      } ${isToday ? "bg-violet-50/20 dark:bg-violet-950/20" : ""}`}
                      style={{ width: dayWidth }}
                    />
                  );
                })}
              </div>

              {/* Vertical Today Line Indicator */}
              {todayIndex !== -1 ? (
                <div
                  className="absolute top-0 bottom-0 z-10 w-0.5 bg-violet-600 dark:bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)] pointer-events-none"
                  style={{ left: todayIndex * dayWidth + dayWidth / 2 }}
                />
              ) : null}

              {/* Floating Task Cards */}
              {taskLayouts.map(({ task, row, leftPx, widthPx }) => {
                const accent = PRIORITY_ACCENTS[task.priority] || PRIORITY_ACCENTS.MEDIUM;
                const isOverdue = getDueDateStatus(task.dueDate) === "overdue";
                const isCompleted = task.status === "DONE";
                const isInProgress = task.status === "IN_PROGRESS";

                const isGradient = isInProgress;

                return (
                  <div
                    key={task.id}
                    className="absolute z-20 group transition-all duration-200"
                    style={{
                      left: leftPx,
                      top: row * rowHeight + 16,
                      width: widthPx,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onViewTask(task)}
                      className={`relative flex w-full flex-col justify-between rounded-2xl border p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                        isGradient
                          ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 border-violet-400/50 text-white shadow-violet-200/50"
                          : isCompleted
                          ? "bg-slate-50/90 border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 opacity-75 text-slate-600 dark:text-slate-300"
                          : `${accent.bg} dark:bg-slate-900 dark:border-slate-700 dark:text-white`
                      }`}
                    >
                      {/* Left vertical accent stripe */}
                      {!isGradient ? (
                        <div
                          className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${accent.stripe}`}
                        />
                      ) : null}

                      {/* Card Content Row */}
                      <div className="flex items-start justify-between gap-2 pl-1.5">
                        <div className="truncate">
                          <p
                            className={`truncate text-xs font-extrabold ${
                              isGradient ? "text-white" : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            {!isGradient ? (
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {accent.tag}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-violet-200">
                                ⚡ In Progress
                              </span>
                            )}
                            {task.dueDate ? (
                              <span
                                className={`text-[9px] font-semibold ${
                                  isGradient
                                    ? "text-violet-200"
                                    : isOverdue
                                    ? "text-red-600 dark:text-red-400 font-bold"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                              >
                                {formatLocalDate(task.dueDate)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Assignee Avatar & Options */}
                        <div className="flex items-center gap-1 shrink-0">
                          {task.assignee ? (
                            <div
                              title={task.assignee.name || task.assignee.email}
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold shadow-2xs ${
                                isGradient
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-slate-900 text-white dark:bg-slate-700"
                              }`}
                            >
                              {(task.assignee.name || task.assignee.email).charAt(0).toUpperCase()}
                            </div>
                          ) : null}
                          <span className={`text-xs ${isGradient ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>⋮</span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
