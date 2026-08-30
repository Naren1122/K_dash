"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";

import { createTaskSchema, CreateTaskFormValues, CreateTaskInput } from "@/lib/schemas/tasksSchema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PriorityBadge, PRIORITY_OPTIONS } from "@/components/board/priority-badge";
import { DueDateBadge } from "@/components/board/due-date-badge";
import { LabelPill } from "@/components/labels/label-pill";
import { LabelPicker } from "@/components/labels/label-picker";
import { ActivityFeed } from "@/components/board/activity-feed";
import { TaskComments } from "@/components/comments/task-comments";
import { TaskDecomposerModal } from "@/components/ai/task-decomposer-modal";
import { toDateInputValue, type Assignee, type BoardTask, type Label } from "@/lib/types/types";

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
  const [isDecomposerOpen, setIsDecomposerOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isAdmin = role === "ADMIN";
  const canEdit = isAdmin || task.assignee?.id === userId;

  const {
    register,
    handleSubmit,
    setValue,
    control,
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

  const labelIds = useWatch({ control, name: "labelIds" }) ?? [];

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

  function handleInsertDecomposedChecklist(checklist: string) {
    const currentDesc = control._formValues.description ?? "";
    const updatedDesc =
      currentDesc && currentDesc.trim().length > 0
        ? `${currentDesc.trim()}\n\n### Implementation Checklist\n${checklist}`
        : `### Implementation Checklist\n${checklist}`;
    setValue("description", updatedDesc, { shouldValidate: true });
  }

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"
        }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-heading"
    >
      <div
        className={`flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:border-slate-700 dark:bg-slate-900/95 ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
          }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700/80 p-5">
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
            aria-label="Close task details"
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:border-rose-800 dark:hover:text-rose-300 cursor-pointer"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {canEdit ? (
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((data) => onUpdate(task.id, data))}>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Title
                  <Input maxLength={200} {...register("title")} />
                </label>
                {errors.title ? (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.title.message}</p>
                ) : null}
              </div>

              {isAdmin ? (
                <>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assignee
                    <Select {...register("assigneeId")}>
                      <option value="">Unassigned</option>
                      {assignee.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name ?? a.email}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Priority
                    <Select {...register("priority")}>
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                </>
              ) : null}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Due date
                  <Input type="date" min={new Date().toISOString().split("T")[0]} {...register("dueDate")} />
                </label>
                {errors.dueDate ? (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.dueDate.message}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 shadow-2xs transition hover:border-indigo-400 hover:from-indigo-100 hover:to-purple-100 dark:border-indigo-800/80 dark:from-indigo-950/60 dark:to-purple-950/40 dark:text-indigo-300 dark:hover:border-indigo-700 cursor-pointer"
                    onClick={() => setIsDecomposerOpen(true)}
                    type="button"
                  >
                    <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                    Break Down with AI
                  </button>
                </div>
                <Textarea
                  maxLength={2000}
                  placeholder="Add useful context, expected outcome, or dependencies..."
                  {...register("description")}
                />
                {errors.description ? (
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.description.message}
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Labels</span>
                <LabelPicker labels={labels} selected={labelIds} onToggle={toggleLabel} />
              </div>
              {error ? (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300 sm:col-span-2"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end sm:col-span-2">
                <button
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  disabled={isPending || isSubmitting}
                  type="submit"
                >
                  {isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Assignee</h3>
              <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
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
            taskDescription={task.description}
            taskId={task.id}
            taskTitle={task.title}
          />

          <div className="mt-8 border-t border-slate-200 dark:border-slate-700/80 pt-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">History of changes for this task</p>
            <ActivityFeed taskId={task.id} />
          </div>
        </div>
      </div>

      <TaskDecomposerModal
        isOpen={isDecomposerOpen}
        onClose={() => setIsDecomposerOpen(false)}
        onInsertChecklist={handleInsertDecomposedChecklist}
        priority={task.priority}
        taskId={task.id}
        taskDescription={task.description}
        taskTitle={task.title}
      />
    </div>
  );
}