"use client";

import { useState } from "react";
import type { BoardTask } from "@/types/types";
import { PriorityBadge } from "@/components/board/priority-badge";
import { getDueDateStatus } from "@/utils/dueDate";

type CalendarViewProps = {
  tasks: BoardTask[];
  onViewTask: (task: BoardTask) => void;
};

export function CalendarView({ tasks, onViewTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  const todayStr = new Date().toDateString();

  return (
    <section aria-label="Calendar View" className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Calendar Header Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold">
              📅
            </span>
            {monthName}
          </h2>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tasks organized by due date</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-600 cursor-pointer"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-slate-600 cursor-pointer"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="mt-3.5 grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 text-center font-semibold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 rounded-t-xl overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-slate-50 dark:bg-slate-800/80 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-b-xl overflow-hidden">
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="min-h-16 sm:min-h-20 bg-slate-50/60 dark:bg-slate-950/60 p-1.5" />;
          }

          const isToday = date.toDateString() === todayStr;
          const dayTasks = tasks.filter((t) => {
            if (!t.dueDate) return false;
            const taskDate = new Date(t.dueDate);
            return (
              taskDate.getFullYear() === date.getFullYear() &&
              taskDate.getMonth() === date.getMonth() &&
              taskDate.getDate() === date.getDate()
            );
          });

          return (
            <div
              key={date.toISOString()}
              className={`min-h-16 sm:min-h-20 bg-white/95 dark:bg-slate-900/95 p-1.5 transition ${
                isToday ? "ring-2 ring-inset ring-sky-500 bg-sky-50/30 dark:bg-sky-950/30" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-5.5 w-5.5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isToday ? "bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-xs" : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayTasks.length > 0 ? (
                  <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400">
                    {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                  </span>
                ) : null}
              </div>

              <div className="mt-1 space-y-1 max-h-14 sm:max-h-16 overflow-y-auto">
                {dayTasks.map((task) => {
                  const dueStatus = getDueDateStatus(task.dueDate);
                  const isOverdue = dueStatus === "overdue";

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onViewTask(task)}
                      className={`w-full text-left truncate rounded-lg p-1.5 text-[11px] font-semibold shadow-2xs transition hover:scale-[1.02] cursor-pointer ${
                        isOverdue
                          ? "bg-rose-50 text-rose-900 border border-rose-200 hover:border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
                          : "bg-slate-50/90 text-slate-800 border border-slate-200 hover:bg-sky-50 hover:border-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-750 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[10px] font-bold">{task.title}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
