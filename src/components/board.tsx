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
import { BoardHeader } from "@/components/layout/board-header";
import { LivePresenceBar } from "@/components/board/live-presence-bar";
import { BoardPaginationBar } from "@/components/board/board-pagination-bar";
import type { Assignee, BoardTask, Label } from "@/lib/types/types";
import type { BoardColumn } from "@/lib/types/column-types";
import type { Role } from "@/lib/types/prisma_type";
import type { CreateTaskInput, TaskStatusValue } from "@/lib/schemas/tasksSchema";
import { filterTasks, sortTasks } from "@/lib/utils/taskFilterSort";
import { useBoardFilterStore, useBoardModalStore } from "@/lib/stores";
import { useBoardRealtime } from "@/hooks/useBoardRealtime";
import { KanbanView } from "@/components/views/kanban-view";

const ListView = dynamic(
  () => import("@/components/views/list-view").then((mod) => mod.ListView),
  { ssr: false }
);

const CalendarView = dynamic(
  () => import("@/components/views/calendar-view").then((mod) => mod.CalendarView),
  { ssr: false }
);

const TimelineView = dynamic(
  () => import("@/components/views/timeline-view").then((mod) => mod.TimelineView),
  { ssr: false }
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

  // Local reactive tasks state synced with server props & realtime updates
  const [liveTasks, setLiveTasks] = useState<BoardTask[]>(tasks);

  const isAdmin = role === "ADMIN";

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
        return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
      });
    },
    onRemoteTaskDeleted: ({ taskId }) => {
      setLiveTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
  });

  const viewingTask = viewingTaskId
    ? liveTasks.find((task) => task.id === viewingTaskId) ?? null
    : null;

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
    closeDeleteConfirm();
    setLiveTasks((prev) => prev.filter((t) => t.id !== taskId));
    broadcastTaskDeleted(taskId);
    run(() => deleteTask(taskId), {
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

  return (
    <main className="p-6 md:p-8 space-y-6">
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

      {error ? (
        <div
          className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 text-xs font-semibold text-red-500 hover:text-red-800 dark:hover:text-red-200 cursor-pointer"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      ) : null}

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

      <BoardPaginationBar
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

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