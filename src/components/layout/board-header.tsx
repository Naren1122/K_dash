"use client";

import Link from "next/link";
import { useState } from "react";
import type { Label } from "@/types/types";
import type { DueDateFilterOption, SortOption } from "@/utils/taskFilterSort";
import { useBoardFilterStore, useBoardModalStore } from "@/lib/stores";

type BoardHeaderProps = {
  isAdmin: boolean;
  labels: Label[];
  presenceNode?: React.ReactNode;
};

export function BoardHeader({ isAdmin, labels, presenceNode }: BoardHeaderProps) {
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);

  // Zustand Filter Store
  const activeView = useBoardFilterStore((state) => state.activeView);
  const setActiveView = useBoardFilterStore((state) => state.setActiveView);
  const selectedLabelIds = useBoardFilterStore((state) => state.selectedLabelIds);
  const toggleLabelFilter = useBoardFilterStore((state) => state.toggleLabelFilter);
  const clearLabelFilters = useBoardFilterStore((state) => state.clearLabelFilters);
  const dueDateFilter = useBoardFilterStore((state) => state.dueDateFilter);
  const setDueDateFilter = useBoardFilterStore((state) => state.setDueDateFilter);
  const sortBy = useBoardFilterStore((state) => state.sortBy);
  const setSortBy = useBoardFilterStore((state) => state.setSortBy);

  // Zustand Modal Store
  const isCreateFormOpen = useBoardModalStore((state) => state.isCreateFormOpen);
  const toggleCreateForm = useBoardModalStore((state) => state.toggleCreateForm);

  return (
    <div className="space-y-4">
      {/* Title & Action Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Board Workspaces
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {isAdmin
              ? "Create, assign, and guide every piece of work across your team."
              : "Track your assigned task progress and update workflow statuses."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {presenceNode}

          {isAdmin ? (
            <Link
              href="/admin/analytics"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-700 dark:hover:text-white"
            >
              📈 Analytics
            </Link>
          ) : null}

          {/* View Switcher Tabs */}
          <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-xs shrink-0 dark:border-slate-800 dark:bg-slate-800/80">
            {([
              { id: "kanban", icon: "📋", label: "Kanban" },
              { id: "list", icon: "📝", label: "List" },
              { id: "calendar", icon: "📅", label: "Calendar" },
              { id: "timeline", icon: "📊", label: "Timeline" },
            ] as const).map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 cursor-pointer ${
                  activeView === view.id
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {view.icon} {view.label}
              </button>
            ))}
          </div>

          {isAdmin ? (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 active:scale-[0.98] focus:outline-none cursor-pointer"
              onClick={toggleCreateForm}
              type="button"
            >
              <span className="text-base leading-none font-bold">+</span>
              {isCreateFormOpen ? "Close Form" : "Create Task"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Filter and Sorting Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Filters:</span>

          {/* Multi-select Label Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLabelDropdown((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer shadow-xs ${
                selectedLabelIds.length > 0
                  ? "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 dark:hover:border-slate-600"
              }`}
            >
              🏷️ Labels {selectedLabelIds.length > 0 ? `(${selectedLabelIds.length})` : ""}
              <span className="text-[10px]">▼</span>
            </button>

            {showLabelDropdown ? (
              <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-2 flex items-center justify-between px-2 pt-1 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Filter by Label
                  </span>
                  {selectedLabelIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearLabelFilters();
                        setShowLabelDropdown(false);
                      }}
                      className="text-[10px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {labels.map((label) => {
                    const isChecked = selectedLabelIds.includes(label.id);
                    return (
                      <label
                        key={label.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleLabelFilter(label.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="truncate font-semibold">{label.name}</span>
                      </label>
                    );
                  })}
                  {labels.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-slate-400">No labels created yet.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Due Date Filter */}
          <select
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value as DueDateFilterOption)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-white focus:border-sky-500 focus:bg-white dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-600 dark:focus:bg-slate-700 cursor-pointer"
          >
            <option value="all">📅 All Due Dates</option>
            <option value="overdue">🚨 Overdue</option>
            <option value="upcoming_48h">⚡ Due in 48h</option>
            <option value="this_week">🗓️ Due This Week</option>
            <option value="this_month">📆 Due This Month</option>
            <option value="no_date">⚪ No Due Date</option>
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-white focus:border-sky-500 focus:bg-white dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-600 dark:focus:bg-slate-700 cursor-pointer"
          >
            <option value="priority_desc">🔥 Priority: High → Low</option>
            <option value="priority_asc">Priority: Low → High</option>
            <option value="due_date_asc">⏰ Due Date: Earliest First</option>
            <option value="due_date_desc">Due Date: Latest First</option>
            <option value="title_asc">🔤 Title: A → Z</option>
            <option value="created_desc">🆕 Created: Newest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}
