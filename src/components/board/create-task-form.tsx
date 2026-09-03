"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createTaskSchema, CreateTaskFormValues, CreateTaskInput } from "@/lib/schemas/tasksSchema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LabelPicker } from "@/components/labels/label-picker";
import { PRIORITY_OPTIONS } from "@/components/board/priority-badge";
import { MagicTaskInput } from "@/components/ai/magic-task-input";
import type { Assignee, Label } from "@/lib/types/types";
import type { MagicTaskResponse, DocumentTaskResponse } from "@/lib/schemas/aiSchema";

type CreateTaskFormProps = {
  assignee: Assignee[];
  labels: Label[];
  isPending: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: CreateTaskInput) => void;
};

export function CreateTaskForm({
  assignee,
  labels,
  isPending,
  isSubmitting,
  error,
  onSubmit,
}: CreateTaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateTaskFormValues, unknown, CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      assigneeId: "",
      priority: "MEDIUM",
      dueDate: "",
      labelIds: [],
    },
  });

  const labelIds = useWatch({ control, name: "labelIds" }) ?? [];

  function toggleLabel(labelId: string) {
    const next = labelIds.includes(labelId)
      ? labelIds.filter((id) => id !== labelId)
      : [...labelIds, labelId];
    setValue("labelIds", next);
  }

  function handleAiPopulate(aiData: MagicTaskResponse | DocumentTaskResponse) {
    if (aiData.title) setValue("title", aiData.title, { shouldValidate: true });
    if (aiData.description !== undefined) setValue("description", aiData.description ?? "", { shouldValidate: true });
    if (aiData.assigneeId !== undefined) setValue("assigneeId", aiData.assigneeId ?? "", { shouldValidate: true });
    if (aiData.priority) setValue("priority", aiData.priority, { shouldValidate: true });
    if (aiData.dueDate !== undefined) setValue("dueDate", aiData.dueDate ?? "", { shouldValidate: true });
    if (aiData.labelIds && aiData.labelIds.length > 0) setValue("labelIds", aiData.labelIds, { shouldValidate: true });
  }

  function submit(data: CreateTaskInput) {
    onSubmit(data);
    reset({
      title: "",
      description: "",
      assigneeId: "",
      priority: "MEDIUM",
      dueDate: "",
      labelIds: [],
    });
  }

  return (
    <form
      className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2 md:p-6"
      onSubmit={handleSubmit(submit)}
    >
      <div className="md:col-span-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs">
            +
          </span>
          Create a new task
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Keep it clear, concise, and assign it to an active team member.
        </p>
      </div>

      <MagicTaskInput
        assignees={assignee}
        labels={labels}
        onPopulate={handleAiPopulate}
      />

      <div className="md:col-span-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Task title
          <Input maxLength={200} placeholder="e.g. Review onboarding flow" {...register("title")} />
        </label>
        {errors.title ? (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.title.message}</p>
        ) : null}
      </div>

      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        Assign to
        <Select {...register("assigneeId")}>
          <option value="">Leave unassigned</option>
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

      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Due date
          <Input type="date" min={new Date().toISOString().split("T")[0]} {...register("dueDate")} />
        </label>
        {errors.dueDate ? (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.dueDate.message}</p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Description
          <Textarea
            maxLength={2000}
            placeholder="Add useful context, expected outcome, or dependencies..."
            {...register("description")}
          />
        </label>
        {errors.description ? (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Labels</span>
        <LabelPicker labels={labels} selected={labelIds} onToggle={toggleLabel} />
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300 md:col-span-2"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end md:col-span-2">
        <button
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          disabled={isPending || isSubmitting}
          type="submit"
        >
          {isPending ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}