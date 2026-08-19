"use client";

import { useState } from "react";
import type { BoardTask } from "@/components/board/types";
import type { TaskStatusValue } from "@/lib/schemas/taskSchema";
import { PriorityBadge } from "@/components/board/priority-badge";
import { DueDateBadge } from "@/components/board/due-date-badge";
import { LabelPill } from "@/components/labels/label-pill";
import { getInitials } from "@/lib/utils/initials";
import type { Assignee } from "@/components/board/types";

type SortField = "title" | "status" | "priority" | "dueDate" | "assignee" | "createdAt";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<TaskStatusValue, number> = { TODO: 0, IN_PROGRESS: 1, DONE: 2 };
const PRIORITY_ORDER = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };

type ListViewProps = {
  tasks: BoardTask[];
  assignees: Assignee[];
  isAdmin: boolean;
  currentUserId: string;
  isPending: boolean;
  onStatusChange: (taskId: string, status: TaskStatusValue) => void;
  onView: (task: BoardTask) => void;
  onDelete: (taskId: string) => void;
};

const STATUS_LABELS: Record<TaskStatusValue, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const STATUS_STYLES: Record<TaskStatusValue, string> = {
  TODO: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export function ListView({
  tasks,
  assignees: _assignees,
  isAdmin,
  currentUserId,
  isPending,
  onStatusChange,
  onView,
  onDelete,
}: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    let result = 0;
    switch (sortField) {
      case "title":
        result = a.title.localeCompare(b.title);
        break;
      case "status":
        result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case "priority":
        result = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
        break;
      case "dueDate":
        if (!a.dueDate && !b.dueDate) result = 0;
        else if (!a.dueDate) result = 1;
        else if (!b.dueDate) result = -1;
        else result = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case "assignee": {
        const aName = a.assignee?.name ?? a.assignee?.email ?? "";
        const bName = b.assignee?.name ?? b.assignee?.email ?? "";
        result = aName.localeCompare(bName);
        break;
      }
      case "createdAt":
        result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortDir === "asc" ? result : -result;
  });

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const isActive = sortField === field;
    return (
      <th
        className="cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
        onClick={() => handleSort(field)}
      >
        <span className="flex items-center gap-1.5">
          {label}
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {isActive ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </span>
      </th>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border border-dashed border-slate-300/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-16 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
        No tasks match the current filters.
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80">
            <tr>
              <SortHeader field="title" label="Task" />
              <SortHeader field="status" label="Status" />
              <SortHeader field="priority" label="Priority" />
              <SortHeader field="assignee" label="Assignee" />
              <SortHeader field="dueDate" label="Due Date" />
              <th className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Labels
              </th>
              {isAdmin ? (
                <th className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {sorted.map((task) => {
              const isMyTask = task.assignee?.id === currentUserId;
              return (
                <tr
                  key={task.id}
                  className="group transition hover:bg-slate-50/60 dark:hover:bg-slate-800/50"
                >
                  {/* Title */}
                  <td className="max-w-xs px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onView(task)}
                          className="truncate font-semibold text-slate-900 dark:text-white text-left hover:text-sky-700 dark:hover:text-sky-400 transition text-sm w-full cursor-pointer"
                        >
                          {task.title}
                        </button>
                        {task.description ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400 dark:text-slate-500">
                            {task.description}
                          </p>
                        ) : null}
                        {!isAdmin && isMyTask ? (
                          <span className="mt-1 inline-block rounded-full bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                            Assigned to you
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {isAdmin || isMyTask ? (
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900 cursor-pointer disabled:opacity-60"
                        defaultValue={task.status}
                        disabled={isPending}
                        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatusValue)}
                      >
                        {(Object.keys(STATUS_LABELS) as TaskStatusValue[]).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-200 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {getInitials(task.assignee.name ?? task.assignee.email)}
                        </span>
                        <span className="truncate text-xs text-slate-600 dark:text-slate-300 max-w-[100px]">
                          {task.assignee.name ?? task.assignee.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="px-4 py-3">
                    <DueDateBadge dueDate={task.dueDate} />
                  </td>

                  {/* Labels */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {task.labels.map((label) => (
                        <LabelPill key={label.id} label={label} />
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  {isAdmin ? (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onView(task)}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/60 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onDelete(task.id)}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60 transition cursor-pointer disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-800/40">
        {tasks.length} task{tasks.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
