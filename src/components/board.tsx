"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  createTask,
  deleteTask,
  reassignTask,
  updateTask,
  updateTaskStatus,
} from "@/lib/actions/tasks";
import { useActionRunner } from "@/hooks/useActionRunner";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { BoardHeader } from "@/components/layout/board-header";
import { KanbanView } from "@/components/views/kanban-view";
import type { Assignee, BoardTask, Label } from "@/lib/types/types";
import type { BoardColumn } from "@/lib/types/column-types";
import type { Role } from "@/lib/types/prisma_type";
import type { CreateTaskInput, TaskStatusValue } from "@/lib/schemas/tasksSchema";
import { filterTasks, sortTasks } from "@/lib/utils/taskFilterSort";
import { useBoardFilterStore, useBoardModalStore } from "@/lib/stores";
import { useBoardRealtime } from "@/hooks/useBoardRealtime";
import { LivePresenceBar } from "@/components/board/live-presence-bar";

// Dynamic imports for secondary views and dialogs to reduce initial client bundle
const ListView = dynamic(
  () => import("@/components/views/list-view").then((mod) => mod.ListView),
  {
    loading: () => <ViewLoadingSkeleton />,
    ssr: false,
  }
);

const CalendarView = dynamic(
  () => import("@/components/views/calendar-view").then((mod) => mod.CalendarView),
  {
    loading: () => <ViewLoadingSkeleton />,
    ssr: false,
  }
);

const TimelineView = dynamic(
  () => import("@/components/views/timeline-view").then((mod) => mod.TimelineView),
  {
    loading: () => <ViewLoadingSkeleton />,
    ssr: false,
  }
);

const TaskDetail = dynamic(
  () => import("@/components/board/task-detail").then((mod) => mod.TaskDetail),
  { ssr: false }
);

const CreateTaskForm = dynamic(
  () => import("@/components/board/create-task-form").then((mod) => mod.CreateTaskForm),
  { ssr: false }
);

const ConfirmDialog = dynamic(
  () => import("@/components/shared/confirm-dialog").then((mod) => mod.ConfirmDialog),
  { ssr: false }
);

function ViewLoadingSkeleton() {
  return (
    <div className="flex h-96 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/60 p-8 dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-sm">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
        <span>Loading view...</span>
      </div>
    </div>
  );
}

type BoardProps = {
  assignee: Assignee[];
  labels: Label[];
  tasks: BoardTask[];
  boardColumns: BoardColumn[];
  role: Role;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
};


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
  const { run, error, setError, isPending } = useActionRunner();

  // Zustand Modal Store
  const isCreateFormOpen = useBoardModalStore((state) => state.isCreateFormOpen);
  const closeCreateForm = useBoardModalStore((state) => state.closeCreateForm);
  const viewingTaskId = useBoardModalStore((state) => state.viewingTaskId);
  const openTaskDetail = useBoardModalStore((state) => state.openTaskDetail);
  const closeTaskDetail = useBoardModalStore((state) => state.closeTaskDetail);
  const deletingTaskId = useBoardModalStore((state) => state.deletingTaskId);
  const openDeleteConfirm = useBoardModalStore((state) => state.openDeleteConfirm);
  const closeDeleteConfirm = useBoardModalStore((state) => state.closeDeleteConfirm);

  // Zustand Filter Store
  const activeView = useBoardFilterStore((state) => state.activeView);
  const selectedLabelIds = useBoardFilterStore((state) => state.selectedLabelIds);
  const dueDateFilter = useBoardFilterStore((state) => state.dueDateFilter);
  const sortBy = useBoardFilterStore((state) => state.sortBy);
  const currentPage = useBoardFilterStore((state) => state.currentPage);
  const setCurrentPage = useBoardFilterStore((state) => state.setCurrentPage);

  // Local reactive tasks state synced with server props & realtime WebSocket updates
  const [liveTasks, setLiveTasks] = useState<BoardTask[]>(tasks);
  const [prevServerTasks, setPrevServerTasks] = useState<BoardTask[]>(tasks);

  if (tasks !== prevServerTasks) {
    setPrevServerTasks(tasks);
    setLiveTasks(tasks);
  }

  const isAdmin = role === "ADMIN";

  // Realtime hook for multi-user sync and online presence
  const {
    onlineUsers,
    isConnected,
    activeViewersMap,
    broadcastTaskMoved,
    broadcastTaskSaved,
    broadcastTaskDeleted,
  } = useBoardRealtime({
    userId,
    userName,
    userEmail,
    role,
    activeTaskId: viewingTaskId,
    onRemoteTaskMoved: ({ taskId, status }) => {
      setLiveTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
    },
    onRemoteTaskSaved: ({ task }) => {
      setLiveTasks((prev) => {
        if (role === "MEMBER" && task.assignee?.id !== userId) {
          return prev.filter((t) => t.id !== task.id);
        }
        const exists = prev.some((t) => t.id === task.id);
        if (exists) {
          return prev.map((t) => (t.id === task.id ? task : t));
        }
        return [task, ...prev];
      });
    },
    onRemoteTaskDeleted: ({ taskId }) => {
      setLiveTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
  });

  const myTasks = liveTasks.filter((task) => task.assignee?.id === userId).length;
  const viewingTask = viewingTaskId
    ? liveTasks.find((task) => task.id === viewingTaskId) ?? null
    : null;

  // Processed tasks (filtered + sorted) — shared across all views
  const processedTasks = useMemo(() => {
    const filtered = filterTasks(liveTasks, { selectedLabelIds, dueDateFilter });
    return sortTasks(filtered, sortBy);
  }, [liveTasks, selectedLabelIds, dueDateFilter, sortBy]);

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

  function onCreateTask(data: CreateTaskInput) {
    run(async () => {
      const createdTask = await createTask(data);
      if (createdTask) {
        setLiveTasks((prev) => [createdTask, ...prev]);
        broadcastTaskSaved(createdTask, true);
      }
      return createdTask;
    }, {
      successMessage: "Task created successfully!",
      onSuccess: () => closeCreateForm(),
    });
  }

  function onUpdateTask(taskId: string, data: CreateTaskInput) {
    run(async () => {
      const updatedTask = await updateTask({ taskId, ...data });
      if (updatedTask) {
        setLiveTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
        broadcastTaskSaved(updatedTask, false);
      }
      return updatedTask;
    }, {
      successMessage: "Task updated successfully!",
    });
  }

  function onStatusChange(taskId: string, status: TaskStatusValue) {
    setLiveTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    broadcastTaskMoved(taskId, status);
    run(() => updateTaskStatus({ taskId, status }));
  }

  function onAssigneeChange(taskId: string, assigneeId: string) {
    const newAssignee = assignee.find((a) => a.id === assigneeId) ?? null;
    setLiveTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee: newAssignee } : t))
    );
    run(async () => {
      const reassignedTask = await reassignTask({ taskId, assigneeId });
      if (reassignedTask) {
        broadcastTaskSaved(reassignedTask, false);
      }
      return reassignedTask;
    });
  }

  function onDeleteTask(taskId: string) {
    const id = taskId;
    closeDeleteConfirm();
    setLiveTasks((prev) => prev.filter((t) => t.id !== id));
    broadcastTaskDeleted(id);
    run(() => deleteTask(id), {
      successMessage: "Task deleted successfully!",
    });
  }

  function onDrop(taskId: string, newStatus: TaskStatusValue) {
    setLiveTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    broadcastTaskMoved(taskId, newStatus);
    run(() => updateTaskStatus({ taskId, status: newStatus }), {
      successMessage: "Task moved!",
    });
  }

  const inProgressCount = liveTasks.filter((task) => task.status === "IN_PROGRESS").length;
  const doneCount = liveTasks.filter((task) => task.status === "DONE").length;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* Board Header & Controls */}
      <BoardHeader
        isAdmin={isAdmin}
        labels={labels}
        presenceNode={
          <LivePresenceBar
            onlineUsers={onlineUsers}
            isConnected={isConnected}
            currentUserId={userId}
          />
        }
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
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{liveTasks.length}</p>
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
        <div
          className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 text-xs font-semibold text-red-500 hover:text-red-800 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Create Task Form */}
      {isAdmin && isCreateFormOpen ? (
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
          activeViewersMap={activeViewersMap}
          onStatusChange={onStatusChange}
          onAssigneeChange={onAssigneeChange}
          onView={(task) => openTaskDetail(task.id)}
          onDelete={openDeleteConfirm}
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
          onView={(task) => openTaskDetail(task.id)}
          onDelete={openDeleteConfirm}
        />
      ) : activeView === "timeline" ? (
        <TimelineView
          tasks={paginatedTasks}
          onViewTask={(task) => openTaskDetail(task.id)}
        />
      ) : (
        <CalendarView
          tasks={paginatedTasks}
          onViewTask={(task) => openTaskDetail(task.id)}
        />
      )}

      {/* Centered Board Pagination Bar - Always displayed */}
      <div className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xs dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
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
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-xs font-bold transition ${safePage === pageItem
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
          onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
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
          onClose={closeTaskDetail}
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
          onCancel={closeDeleteConfirm}
          onConfirm={() => onDeleteTask(deletingTaskId)}
          taskTitle={liveTasks.find((task) => task.id === deletingTaskId)?.title ?? "this task"}
        />
      ) : null}
    </main>
  );
}