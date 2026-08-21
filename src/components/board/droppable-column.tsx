"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DraggableTaskCard } from "@/components/board/draggable-task-card";
import type { Assignee, BoardTask } from "@/types/types";
import type { BoardColumn } from "@/types/column-types";
import type { TaskStatusValue } from "@/lib/schemas/tasksSchema";

type DroppableColumnProps = {
  column: BoardColumn;
  tasks: BoardTask[];
  assignee: Assignee[];
  isAdmin: boolean;
  currentUserId: string;
  isPending: boolean;
  onStatusChange: (taskId: string, status: TaskStatusValue) => void;
  onAssigneeChange: (taskId: string, assigneeId: string) => void;
  onView: (task: BoardTask) => void;
  onDelete: (taskId: string) => void;
};

const COLUMN_STYLES: Record<string, { border: string; soft: string; accent: string; badge: string; subtitle: string }> = {
  TODO: {
    border: "border-slate-200 dark:border-slate-800",
    soft: "bg-slate-50/60 dark:bg-slate-900/40",
    accent: "bg-sky-500",
    badge: "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    subtitle: "Ready when you are",
  },
  IN_PROGRESS: {
    border: "border-slate-200 dark:border-slate-800",
    soft: "bg-slate-50/60 dark:bg-slate-900/40",
    accent: "bg-amber-500",
    badge: "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    subtitle: "Work in motion",
  },
  DONE: {
    border: "border-slate-200 dark:border-slate-800",
    soft: "bg-slate-50/60 dark:bg-slate-900/40",
    accent: "bg-emerald-500",
    badge: "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    subtitle: "Completed work",
  },
};

const DEFAULT_STYLE = {
  border: "border-slate-200 dark:border-slate-800",
  soft: "bg-slate-50/60 dark:bg-slate-900/40",
  accent: "bg-slate-400",
  badge: "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  subtitle: "Custom column",
};

export function DroppableColumn({
  column,
  tasks,
  assignee,
  isAdmin,
  currentUserId,
  isPending,
  onStatusChange,
  onAssigneeChange,
  onView,
  onDelete,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { column } });
  const style = COLUMN_STYLES[column.status] ?? DEFAULT_STYLE;

  const isAtLimit = column.wipLimit !== null && tasks.length >= column.wipLimit;
  const isOverLimit = column.wipLimit !== null && tasks.length > column.wipLimit;

  return (
    <section
      className={`rounded-2xl border shadow-sm ${style.border} ${style.soft} p-4 transition-all duration-200 backdrop-blur-xs ${
        isOver ? "ring-4 ring-sky-400/40 scale-[1.01] shadow-lg shadow-sky-500/15" : ""
      }`}
    >
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white">
            <span className={`h-3 w-3 rounded-full ${style.accent} ring-4 ring-white/90 dark:ring-slate-900`} />
            {column.name}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{style.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* WIP limit badge */}
          {column.wipLimit !== null ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                isOverLimit
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 animate-bounce"
                  : isAtLimit
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
              title={`WIP Limit: ${column.wipLimit}`}
            >
              {tasks.length}/{column.wipLimit}
            </span>
          ) : null}
          <span className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2.5 text-xs font-extrabold shadow-xs border ${style.badge}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* WIP limit over-limit warning */}
      {isOverLimit ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          ⚠️ WIP limit exceeded ({tasks.length}/{column.wipLimit})
        </p>
      ) : null}

      {/* Droppable sortable area */}
      <div ref={setNodeRef} className="space-y-3 min-h-16">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              assignee={assignee}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              isPending={isPending}
              onStatusChange={onStatusChange}
              onAssigneeChange={onAssigneeChange}
              onView={onView}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-800/40 px-4 py-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            {isOver ? "Drop task here" : "No tasks match current filters."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
