"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import {
  createTask,
  deleteTask,
  reassignTask,
  updateTask,
  updateTaskStatus,
} from "@/actions/tasks";
import { useToast } from "@/components/providers/toast-provider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CreateTaskForm } from "@/components/board/create-task-form";
import { TaskDetail } from "@/components/board/task-detail";
import { BoardHeader } from "@/components/layout/board-header";
import { KanbanView } from "@/components/views/kanban-view";
import { ListView } from "@/components/views/list-view";
import { CalendarView } from "@/components/views/calendar-view";
import { TimelineView } from "@/components/views/timeline-view";
import type { Assignee, BoardTask, Label } from "@/types/types";
import type { BoardColumn } from "@/types/column-types";
import type { CreateTaskInput, TaskStatusValue } from "@/lib/schemas/tasksSchema";
import {
  filterTasks,
  sortTasks,
  type DueDateFilterOption,
  type SortOption,
} from "@/utils/taskFilterSort";

const VIEW_STORAGE_KEY = "kanban_active_view";

type ActiveView = "kanban" | "list" | "calendar" | "timeline";

type BoardProps = {
  assignee: Assignee[];
  labels: Label[];
  tasks: BoardTask[];
  boardColumns: BoardColumn[];
  role: "ADMIN" | "MEMBER";
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
};

function actionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function Board({
  assignee,
  labels,
  tasks,
  boardColumns,
  role,
  userId,
  userName,
  userEmail,
}: BoardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>("kanban");
  const { showToast } = useToast();

  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY) as ActiveView | null;
    if (savedView && ["kanban", "list", "calendar", "timeline"].includes(savedView)) {
      const raf = requestAnimationFrame(() => setActiveView(savedView));
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  function handleViewChange(view: ActiveView) {
    setActiveView(view);
    localStorage.setItem(VIEW_STORAGE_KEY, view);
    setCurrentPage(1);
  }

  // Filter, Sort & Pagination State
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(3);

  const isAdmin = role === "ADMIN";
  const myTasks = tasks.filter((task) => task.assignee?.id === userId).length;
  const viewingTask = viewingTaskId
    ? tasks.find((task) => task.id === viewingTaskId) ?? null
    : null;

  // Processed tasks (filtered + sorted) — shared across all views
  const processedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, { selectedLabelIds, dueDateFilter });
    return sortTasks(filtered, sortBy);
  }, [tasks, selectedLabelIds, dueDateFilter, sortBy]);

  // Reset to Page 1 when filters/sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLabelIds, dueDateFilter, sortBy, pageSize]);

  const totalPages = useMemo(() => {
    if (activeView === "kanban") {
      if (processedTasks.length === 0) return 1;
      const countsByStatus: Record<string, number> = {};
      for (const t of processedTasks) {
        countsByStatus[t.status] = (countsByStatus[t.status] || 0) + 1;
      }
      const maxCount = Math.max(0, ...Object.values(countsByStatus));
      return Math.max(1, Math.ceil(maxCount / 3));
    }
    return Math.max(1, Math.ceil(processedTasks.length / 3));
  }, [processedTasks, activeView]);

  const safePage = Math.min(currentPage, totalPages);

  const paginatedTasks = useMemo(() => {
    const start = (safePage - 1) * 3;
    const end = start + 3;

    if (activeView === "kanban") {
      const tasksByStatus: Record<string, BoardTask[]> = {};
      for (const t of processedTasks) {
        if (!tasksByStatus[t.status]) tasksByStatus[t.status] = [];
        tasksByStatus[t.status].push(t);
      }

      const result: BoardTask[] = [];
      for (const status in tasksByStatus) {
        result.push(...tasksByStatus[status].slice(start, end));
      }
      return result;
    }

    return processedTasks.slice(start, end);
  }, [processedTasks, safePage, activeView]);

  function getPageNumbers(current: number, total: number) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, "...", total];
    if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  }

  function toggleLabelFilter(labelId: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  }

  function runAction(action: () => Promise<unknown>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        onSuccess?.();
      } catch (caughtError) {
        setError(actionErrorMessage(caughtError));
        showToast(actionErrorMessage(caughtError), "error");
      }
    });
  }

  function onCreateTask(data: CreateTaskInput) {
    runAction(
      () => createTask(data),
      () => {
        setShowCreateForm(false);
        showToast("Task created successfully!", "success");
      },
    );
  }

  function onUpdateTask(taskId: string, data: CreateTaskInput) {
    runAction(
      () => updateTask({ taskId, ...data }),
      () => showToast("Task updated successfully!", "success"),
    );
  }

  function onStatusChange(taskId: string, status: TaskStatusValue) {
    runAction(() => updateTaskStatus({ taskId, status }));
  }

  function onAssigneeChange(taskId: string, assigneeId: string) {
    runAction(() => reassignTask({ taskId, assigneeId }));
  }

  function onDeleteTask(taskId: string) {
    const id = taskId;
    setDeletingTaskId(null);
    runAction(
      () => deleteTask(id),
      () => showToast("Task deleted successfully!", "success"),
    );
  }

  // Called when a task is dropped onto a new column (dnd)
  function onDrop(taskId: string, newStatus: TaskStatusValue) {
    runAction(
      () => updateTaskStatus({ taskId, status: newStatus }),
      () => showToast("Task moved!", "success"),
    );
  }

  const inProgressCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((task) => task.status === "DONE").length;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* Board Header & Controls */}
      <BoardHeader
        activeView={activeView}
        dueDateFilter={dueDateFilter}
        isAdmin={isAdmin}
        labels={labels}
        onClearLabelFilter={() => setSelectedLabelIds([])}
        onDueDateFilterChange={setDueDateFilter}
        onSortByChange={setSortBy}
        onToggleCreateForm={() => setShowCreateForm((prev) => !prev)}
        onToggleLabelFilter={toggleLabelFilter}
        onViewChange={handleViewChange}
        selectedLabelIds={selectedLabelIds}
        showCreateForm={showCreateForm}
        sortBy={sortBy}
      />

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Tasks</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold">
              📊
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{tasks.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Progress</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 text-xs font-bold">
              ⚡
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{inProgressCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAdmin ? "Completed" : "Assigned to You"}
            </p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-bold">
              ✓
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAdmin ? doneCount : myTasks}
          </p>
        </div>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Create Task Form */}
      {isAdmin && showCreateForm ? (
        <CreateTaskForm
          assignee={assignee}
          error={error}
          isPending={isPending}
          isSubmitting={isPending}
          labels={labels}
          onSubmit={onCreateTask}
        />
      ) : null}

      {/* Active View */}
      {activeView === "kanban" ? (
        <KanbanView
          columns={boardColumns}
          tasks={paginatedTasks}
          assignee={assignee}
          isAdmin={isAdmin}
          currentUserId={userId}
          isPending={isPending}
          onStatusChange={onStatusChange}
          onAssigneeChange={onAssigneeChange}
          onView={(task) => setViewingTaskId(task.id)}
          onDelete={setDeletingTaskId}
          onDrop={onDrop}
        />
      ) : activeView === "list" ? (
        <ListView
          tasks={paginatedTasks}
          assignees={assignee}
          isAdmin={isAdmin}
          currentUserId={userId}
          isPending={isPending}
          onStatusChange={onStatusChange}
          onView={(task) => setViewingTaskId(task.id)}
          onDelete={setDeletingTaskId}
        />
      ) : activeView === "timeline" ? (
        <TimelineView
          tasks={paginatedTasks}
          onViewTask={(task) => setViewingTaskId(task.id)}
        />
      ) : (
        <CalendarView
          tasks={paginatedTasks}
          onViewTask={(task) => setViewingTaskId(task.id)}
        />
      )}

      {/* Centered Board Pagination Bar - Always displayed */}
      <div className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xs dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers(safePage, totalPages).map((pageItem, idx) =>
          typeof pageItem === "number" ? (
            <button
              key={pageItem}
              type="button"
              disabled={totalPages <= 1}
              onClick={() => setCurrentPage(pageItem)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-xs font-bold transition ${
                safePage === pageItem
                  ? "bg-slate-900 text-white font-extrabold shadow-xs dark:bg-sky-600 dark:text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              } ${totalPages <= 1 ? "cursor-default" : "cursor-pointer"}`}
            >
              {pageItem}
            </button>
          ) : (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
              ...
            </span>
          )
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Task Detail Dialog */}
      {viewingTask ? (
        <TaskDetail
          assignee={assignee}
          error={error}
          isPending={isPending}
          isSubmitting={isPending}
          labels={labels}
          onClose={() => setViewingTaskId(null)}
          onUpdate={onUpdateTask}
          role={role}
          task={viewingTask}
          userEmail={userEmail ?? ""}
          userId={userId}
          userName={userName ?? null}
        />
      ) : null}

      {/* Confirm Delete Dialog */}
      {deletingTaskId ? (
        <ConfirmDialog
          onCancel={() => setDeletingTaskId(null)}
          onConfirm={() => onDeleteTask(deletingTaskId)}
          taskTitle={tasks.find((task) => task.id === deletingTaskId)?.title ?? "this task"}
        />
      ) : null}
    </main>
  );
}