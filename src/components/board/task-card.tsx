"use client";

import { PriorityBadge } from "@/components/board/priority-badge";
import { DueDateBadge } from "@/components/board/due-date-badge";
import { LabelPill } from "@/components/labels/label-pill";
import { columns, statusLabels, type Assignee, type BoardTask } from "@/types/types";
import type { TaskStatusValue } from "@/lib/schemas/tasksSchema";
import { getInitials } from "@/utils/initials";

type TaskCardProps = {
  task: BoardTask;
  assignee: Assignee[];
  isAdmin: boolean;
  currentUserId: string;
  isPending: boolean;
  onStatusChange: (taskId: string, status: TaskStatusValue) => void;
  onAssigneeChange: (taskId: string, assigneeId: string) => void;
  onView: (task: BoardTask) => void;
  onDelete: (taskId: string) => void;
};

export function TaskCard({
  task,
  assignee,
  isAdmin,
  currentUserId,
  isPending,
  onStatusChange,
  onAssigneeChange,
  onView,
  onDelete,
}: TaskCardProps) {
  const canUpdateStatus = isAdmin || task.assignee?.id === currentUserId;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-5 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {task.title}
        </h3>
        <button
          aria-label={`View details for ${task.title}`}
          className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 dark:hover:border-slate-600 cursor-pointer"
          onClick={() => onView(task)}
          type="button"
        >
          View
        </button>
      </div>

      {/* Badges container: Priority, Labels & Due Date */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.labels.map((label) => (
          <LabelPill key={label.id} label={label} />
        ))}
        <DueDateBadge dueDate={task.dueDate} />
      </div>

      {task.description ? (
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{task.description}</p>
      ) : (
        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">No description added.</p>
      )}

      <div className="mt-4 grid gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Status
          <select
            aria-label={`Status for ${task.title}`}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            defaultValue={task.status}
            disabled={!canUpdateStatus || isPending}
            onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatusValue)}
          >
            {columns.map((option) => (
              <option key={option.status} value={option.status}>
                {statusLabels[option.status]}
              </option>
            ))}
          </select>
        </label>

        {isAdmin ? (
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Assignee
            <select
              aria-label={`Assignee for ${task.title}`}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              defaultValue={task.assignee?.id ?? ""}
              disabled={isPending}
              onChange={(event) => onAssigneeChange(task.id, event.target.value)}
            >
              <option value="">Unassigned</option>
              {assignee.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name ?? a.email}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {task.assignee ? getInitials(task.assignee.name ?? task.assignee.email) : "--"}
            </span>
            <p className="min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
              {task.assignee ? task.assignee.name ?? task.assignee.email : "Unassigned"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex min-h-6 items-center justify-between gap-2">
        <span>
          {!isAdmin && task.assignee?.id === currentUserId ? (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
              Assigned to you
            </span>
          ) : null}
        </span>
        {isAdmin ? (
          <button
            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 shadow-xs transition hover:bg-rose-100 hover:border-rose-300 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/40 disabled:opacity-60 cursor-pointer"
            disabled={isPending}
            onClick={() => onDelete(task.id)}
            type="button"
          >
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}