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
        className={`flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:border-slate-800 dark:bg-slate-900 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs">
              #
            </div>
            <div className="min-w-0">
              <h2
                className="truncate text-base font-bold text-slate-900 dark:text-white"
                id="task-detail-heading"
              >
                {task.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-slate-400">Status: {task.status}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <PriorityBadge priority={task.priority} />
                <DueDateBadge dueDate={task.dueDate} />
              </div>
            </div>
          </div>
          <button
            aria-label="Close task details"
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: 2-column Stitch layout */}
        <div className="flex-1 overflow-y-auto p-6">
          {canEdit ? (
            <form onSubmit={handleSubmit((data) => onUpdate(task.id, data))}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (Left 2 cols) */}
                <div className="lg:col-span-2 space-y-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Task Title
                    </label>
                    <Input maxLength={200} {...register("title")} className="text-sm font-semibold" />
                    {errors.title ? (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.title.message}</p>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Description & Checklist
                      </label>
                      <button
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 shadow-2xs transition hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/60 dark:text-sky-300 cursor-pointer"
                        onClick={() => setIsDecomposerOpen(true)}
                        type="button"
                      >
                        <Sparkles className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                        Break Down with AI
                      </button>
                    </div>
                    <Textarea
                      maxLength={2000}
                      rows={5}
                      placeholder="Add useful context, expected outcome, or dependencies..."
                      {...register("description")}
                    />
                    {errors.description ? (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                        {errors.description.message}
                      </p>
                    ) : null}
                  </div>

                  {/* Comments Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  </div>

                  {/* Activity Log */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Log</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Audit trail of changes for this task</p>
                    <ActivityFeed taskId={task.id} />
                  </div>
                </div>

                {/* Sidebar Metadata (Right col) */}
                <div className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Task Metadata
                  </h3>

                  {isAdmin ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Assignee
                        </label>
                        <Select {...register("assigneeId")}>
                          <option value="">Unassigned</option>
                          {assignee.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name ?? a.email}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Priority
                        </label>
                        <Select {...register("priority")}>
                          {PRIORITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Assignee</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {task.assignee ? task.assignee.name ?? task.assignee.email : "Unassigned"}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Due Date
                    </label>
                    <Input type="date" min={new Date().toISOString().split("T")[0]} {...register("dueDate")} />
                    {errors.dueDate ? (
                      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.dueDate.message}</p>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Labels</span>
                    <LabelPicker labels={labels} selected={labelIds} onToggle={toggleLabel} />
                  </div>

                  {error ? (
                    <p
                      className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  <div className="pt-2">
                    <button
                      className="w-full rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
                      disabled={isPending || isSubmitting}
                      type="submit"
                    >
                      {isPending ? "Saving changes..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{task.description || "No description."}</p>
              </div>
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
            </div>
          )}
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