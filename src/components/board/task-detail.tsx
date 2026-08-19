"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createTaskSchema, CreateTaskFormValues, CreateTaskInput } from "@/lib/schemas/taskSchema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PriorityBadge, PRIORITY_OPTIONS } from "@/components/board/priority-badge";
import { DueDateBadge } from "@/components/board/due-date-badge";
import { LabelPill } from "@/components/labels/label-pill";
import { LabelPicker } from "@/components/labels/label-picker";
import { ActivityFeed } from "@/components/board/activity-feed";
import { TaskComments } from "@/components/comments/task-comments";
import { toDateInputValue, type Assignee, type BoardTask, type Label } from "@/components/board/types";

type TaskDetailProps = {
  task: BoardTask;
  assignee: Assignee[];
  labels: Label[];
  role: "ADMIN" | "MEMBER";
  userId: string;
  userName: string | null;
  userEmail: string;
  isPending: boolean;
  isSubmitting: boolean;
  error: string | null;
  onUpdate: (taskId: string, data: CreateTaskInput) => void;
  onClose: () => void;
};

export function TaskDetail({
  task,
  assignee,
  labels,
  role,
  userId,
  userName,
  userEmail,
  isPending,
  isSubmitting,
  error,
  onUpdate,
  onClose,
}: TaskDetailProps) {
  const [visible, setVisible] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isAdmin = role === "ADMIN";
  const canEdit = isAdmin || task.assignee?.id === userId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskFormValues, unknown, CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      assigneeId: task.assignee?.id ?? "",
      priority: task.priority,
      dueDate: toDateInputValue(task.dueDate),
      labelIds: task.labels.map((label) => label.id),
    },
  });

  const labelIds = watch("labelIds") ?? [];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function toggleLabel(labelId: string) {
    const next = labelIds.includes(labelId)
      ? labelIds.filter((id) => id !== labelId)
      : [...labelIds, labelId];
    setValue("labelIds", next);
  }

  function handleBackdropClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-heading"
    >
      <div
        className={`flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_60px_-20px_rgba(15,23,42,0.5)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:border-slate-800 dark:bg-slate-900 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 p-5">
          <div className="min-w-0">
            <h2
              className="truncate text-lg font-bold text-slate-900 dark:text-white"
              id="task-detail-heading"
            >
              {task.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              {task.labels.map((label) => (
                <LabelPill key={label.id} label={label} />
              ))}
              <DueDateBadge dueDate={task.dueDate} />
            </div>
          </div>
          <button
            ref={closeRef}
            aria-label="Close task details"
            className="shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Description</h3>
            {task.description ? (
              <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-300">
                {task.description}
              </p>
            ) : (
              <p className="mt-1.5 text-sm italic text-slate-400 dark:text-slate-500">No description added.</p>
            )}
          </div>

          {canEdit ? (
            <form
              className="mt-6 grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/40"
              onSubmit={handleSubmit((data) => onUpdate(task.id, data))}
            >
              <div className="sm:col-span-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit task</h3>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Title
                  <Input maxLength={200} {...register("title")} />
                </label>
                {errors.title ? (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.title.message}</p>
                ) : null}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assign to
                  <Select disabled={!isAdmin} {...register("assigneeId")}>
                    <option value="">Unassigned</option>
                    {assignee.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name ?? a.email}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Priority
                  <Select disabled={!isAdmin} {...register("priority")}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </label>
                {!isAdmin ? (
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    Only administrators can change priority.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Due date
                  <Input type="date" {...register("dueDate")} />
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Description
                  <Textarea maxLength={2000} {...register("description")} />
                </label>
                {errors.description ? (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.description.message}
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700">Labels</span>
                <LabelPicker labels={labels} selected={labelIds} onToggle={toggleLabel} />
              </div>
              {error ? (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:col-span-2"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end sm:col-span-2">
                <button
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending || isSubmitting}
                  type="submit"
                >
                  {isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assignee</h3>
              <p className="mt-1.5 text-sm font-semibold text-slate-800">
                {task.assignee ? task.assignee.name ?? task.assignee.email : "Unassigned"}
              </p>
            </div>
          )}

          <TaskComments
            assignees={assignee}
            comments={task.comments}
            currentUserEmail={userEmail}
            currentUserId={userId}
            currentUserName={userName}
            role={role}
            taskId={task.id}
          />

          <div className="mt-8 border-t border-slate-200/80 pt-6">
            <h3 className="text-sm font-bold text-slate-900">Activity Log</h3>
            <p className="text-xs text-slate-500">History of changes for this task</p>
            <ActivityFeed taskId={task.id} />
          </div>
        </div>
      </div>
    </div>
  );
}