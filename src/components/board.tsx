"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTask, deleteTask, reassignTask, updateTaskStatus } from "@/app/actions/tasks";
import { useToast } from "@/components/toast-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { createTaskSchema, CreateTaskFormValues, CreateTaskInput } from "@/lib/taskSchema";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type Assignee = { id: string; name: string | null; email: string };
type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  assignee: Assignee | null;
};

type BoardProps = {
  assignee: Assignee[];
  tasks: BoardTask[];
  role: "ADMIN" | "MEMBER";
  userId: string;
};

const columns: Array<{
  status: TaskStatus;
  label: string;
  accent: string;
  soft: string;
  border: string;
  subtitle: string;
}> = [
    { status: "TODO", label: "To do", subtitle: "Ready when you are", accent: "bg-sky-500", soft: "bg-sky-50/60", border: "border-sky-200/80" },
    { status: "IN_PROGRESS", label: "In progress", subtitle: "Work in motion", accent: "bg-amber-500", soft: "bg-amber-50/60", border: "border-amber-200/80" },
    { status: "DONE", label: "Done", subtitle: "Completed work", accent: "bg-emerald-500", soft: "bg-emerald-50/60", border: "border-emerald-200/80" },
  ];

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

function actionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function Board({ assignee, tasks, role, userId }: BoardProps) {
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormValues, unknown, CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", description: "", assigneeId: "" },
  });
  const isAdmin = role === "ADMIN";
  const myTasks = tasks.filter((task) => task.assignee?.id === userId).length;

  function runAction(action: () => Promise<unknown>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        onSuccess?.();
      } catch (caughtError) {
        setError(actionErrorMessage(caughtError));
      }
    });
  }

  function onSubmit(data: CreateTaskInput) {
    runAction(
      () => createTask(data),
      () => {
        reset();
        setShowCreateForm(false);
        showToast("Task created successfully!", "success");
      }
    );
  }

  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <main className="p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Board Workspaces
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {isAdmin
              ? "Create, assign, and guide every piece of work across your team."
              : "Track your assigned task progress and update workflow statuses."}
          </p>
        </div>
        {isAdmin ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
            onClick={() => setShowCreateForm((visible) => !visible)}
            type="button"
          >
            <span className="text-lg leading-none">+</span>
            {showCreateForm ? "Close Form" : "Create Task"}
          </button>
        ) : null}
      </div>

      {/* Metrics Banner */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Tasks</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{tasks.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">In Progress</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600">{inProgressCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            {isAdmin ? "Completed" : "Assigned to You"}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">
            {isAdmin ? doneCount : myTasks}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm" role="alert">
          {error}
        </p>
      ) : null}

      {/* Create Task Form */}
      {isAdmin && showCreateForm ? (
        <form
          className="mt-6 grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:grid-cols-2 md:p-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="md:col-span-2">
            <h3 className="text-base font-bold text-slate-900">Create a new task</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Keep it clear, concise, and assign it to a team member when ready.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Task title
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                maxLength={200}
                placeholder="e.g. Review onboarding flow"
                {...register("title")}
              />
            </label>
            {errors.title ? (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.title.message}</p>
            ) : null}
          </div>
          <label className="text-xs font-semibold text-slate-700">
            Assign to
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
              {...register("assigneeId")}
            >
              <option value="">Leave unassigned</option>
              {assignee.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name ?? a.email}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">
              Description
              <textarea
                className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                maxLength={2000}
                placeholder="Add useful context, expected outcome, or dependencies..."
                {...register("description")}
              />
            </label>
            {errors.description ? (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.description.message}</p>
            ) : null}
          </div>
          <div className="flex justify-end md:col-span-2">
            <button
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || isSubmitting}
              type="submit"
            >
              {isPending ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Kanban Board Columns */}
      <section aria-label="Kanban board" className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);
          return (
            <section
              className={`rounded-2xl border ${column.border} ${column.soft} p-4`}
              key={column.status}
            >
              <div className="mb-4 flex items-center justify-between px-1">
                <div>
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.accent} ring-4 ring-white`} />
                    {column.label}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">{column.subtitle}</p>
                </div>
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-slate-700 shadow-sm border border-slate-200/60">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const canUpdateStatus = isAdmin || task.assignee?.id === userId;
                  return (
                    <article
                      className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
                      key={task.id}
                    >
                      <h3 className="text-sm font-bold leading-5 text-slate-900">{task.title}</h3>
                      {task.description ? (
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                          {task.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs italic text-slate-400">No description added.</p>
                      )}
                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Status
                          <select
                            aria-label={`Status for ${task.title}`}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                            defaultValue={task.status}
                            disabled={!canUpdateStatus || isPending}
                            onChange={(event) =>
                              runAction(() =>
                                updateTaskStatus({
                                  taskId: task.id,
                                  status: event.target.value,
                                })
                              )
                            }
                          >
                            {columns.map((option) => (
                              <option key={option.status} value={option.status}>
                                {statusLabels[option.status]}
                              </option>
                            ))}
                          </select>
                        </label>
                        {isAdmin ? (
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Assignee
                            <select
                              aria-label={`Assignee for ${task.title}`}
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                              defaultValue={task.assignee?.id ?? ""}
                              disabled={isPending}
                              onChange={(event) =>
                                runAction(() =>
                                  reassignTask({
                                    taskId: task.id,
                                    assigneeId: event.target.value,
                                  })
                                )
                              }
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
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">
                              {task.assignee ? initials(task.assignee.name ?? task.assignee.email) : "--"}
                            </span>
                            <p className="min-w-0 truncate text-xs font-medium text-slate-600">
                              {task.assignee ? task.assignee.name ?? task.assignee.email : "Unassigned"}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex min-h-6 items-center justify-between gap-2">
                        <span>
                          {role === "MEMBER" && task.assignee?.id === userId ? (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              Assigned to you
                            </span>
                          ) : null}
                        </span>
                        {isAdmin ? (
                          <button
                            className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                            disabled={isPending}
                            onClick={() => setDeletingTaskId(task.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
                {columnTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300/80 bg-white/60 px-4 py-8 text-center text-xs font-medium text-slate-400">
                    No tasks here yet.
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </section>

      {/* Confirm Delete Dialog */}
      {deletingTaskId ? (
        <ConfirmDialog
          taskTitle={tasks.find((t) => t.id === deletingTaskId)?.title ?? "this task"}
          onConfirm={() => {
            const taskId = deletingTaskId;
            setDeletingTaskId(null);
            runAction(
              () => deleteTask(taskId),
              () => showToast("Task deleted successfully!", "success")
            );
          }}
          onCancel={() => setDeletingTaskId(null)}
        />
      ) : null}
    </main>
  );
}
