"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DraggableTaskCard } from "@/components/board/draggable-task-card";
import type { Assignee, BoardTask } from "@/components/board/types";
import type { BoardColumn } from "@/components/board/column-types";
import type { TaskStatusValue } from "@/lib/schemas/taskSchema";

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

const COLUMN_STYLES: Record<string, { border: string; soft: string; accent: string; subtitle: string }> = {
  TODO: { border: "border-sky-200/80 dark:border-sky-900/60", soft: "bg-sky-50/60 dark:bg-sky-950/20", accent: "bg-sky-500", subtitle: "Ready when you are" },
  IN_PROGRESS: { border: "border-amber-200/80 dark:border-amber-900/60", soft: "bg-amber-50/60 dark:bg-amber-950/20", accent: "bg-amber-500", subtitle: "Work in motion" },
  DONE: { border: "border-emerald-200/80 dark:border-emerald-900/60", soft: "bg-emerald-50/60 dark:bg-emerald-950/20", accent: "bg-emerald-500", subtitle: "Completed work" },
};

const DEFAULT_STYLE = { border: "border-slate-200/80 dark:border-slate-800", soft: "bg-slate-50/60 dark:bg-slate-900/40", accent: "bg-slate-400", subtitle: "Custom column" };

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
      className={`rounded-2xl border ${style.border} ${style.soft} p-4 transition-all ${
        isOver ? "ring-2 ring-sky-400 ring-offset-1" : ""
      }`}
    >
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white">
            <span className={`h-2.5 w-2.5 rounded-full ${style.accent} ring-4 ring-white dark:ring-slate-900`} />
            {column.name}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{style.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* WIP limit badge */}
          {column.wipLimit !== null ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isOverLimit
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : isAtLimit
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
              title={`WIP Limit: ${column.wipLimit}`}
            >
              {tasks.length}/{column.wipLimit}
            </span>
          ) : null}
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/60 dark:border-slate-700">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* WIP limit over-limit warning */}
      {isOverLimit ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
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
          <p className="rounded-xl border border-dashed border-slate-300/80 bg-white/60 px-4 py-8 text-center text-xs font-medium text-slate-400">
            {isOver ? "Drop task here" : "No tasks match current filters."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
