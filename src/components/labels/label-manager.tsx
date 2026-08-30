"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createLabel, deleteLabel, updateLabel } from "@/lib/actions/labels";
import {
  createLabelSchema,
  CreateLabelFormValues,
  CreateLabelInput,
  labelColors,
} from "@/lib/schemas/labelsSchema";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/lib/types/types";
import { useActionRunner } from "@/hooks/useActionRunner";

type LabelManagerProps = {
  labels: Label[];
};

export function LabelManager({ labels }: LabelManagerProps) {
  const { run, error, setError, isPending } = useActionRunner();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.max(1, Math.ceil(labels.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedLabels = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return labels.slice(start, start + pageSize);
  }, [labels, safePage, pageSize]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateLabelFormValues, unknown, CreateLabelInput>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: { name: "", color: "#3b82f6" },
  });

  const selectedColor = useWatch({ control, name: "color" }) ?? "#3b82f6";

  function startEdit(label: Label) {
    const color = (labelColors as readonly string[]).includes(label.color)
      ? label.color
      : "#3b82f6";
    setEditingId(label.id);
    setValue("name", label.name);
    setValue("color", color as CreateLabelInput["color"]);
    setError(null);
  }

  function onSubmit(data: CreateLabelInput) {
    if (editingId) {
      run(
        () => updateLabel({ id: editingId, name: data.name, color: data.color }),
        {
          successMessage: "Label updated successfully!",
          onSuccess: () => {
            reset({ name: "", color: "#3b82f6" });
            setEditingId(null);
          },
        }
      );
    } else {
      run(
        () => createLabel({ name: data.name, color: data.color }),
        {
          successMessage: "Label created successfully!",
          onSuccess: () => {
            reset({ name: "", color: "#3b82f6" });
          },
        }
      );
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Labels</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Create and manage reusable tags for your tasks.
          </p>
        </div>
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          {labels.length}
        </span>
      </div>

      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {editingId ? "Rename label" : "Label name"}
            <Input
              maxLength={50}
              placeholder="e.g. bug, feature, docs"
              {...register("name")}
            />
          </label>
          {errors.name ? (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.name.message}</p>
          ) : null}
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Color</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {labelColors.map((color: string) => (
              <button
                key={color}
                aria-label={`Choose color ${color}`}
                aria-pressed={selectedColor === color}
                className={`h-7 w-7 rounded-full transition cursor-pointer ${selectedColor === color
                  ? "ring-2 ring-slate-900 dark:ring-white ring-offset-2 dark:ring-offset-slate-900"
                  : "hover:scale-110"
                  }`}
                onClick={() => setValue("color", color as CreateLabelInput["color"], { shouldValidate: true })}
                style={{ backgroundColor: color }}
                type="button"
              />
            ))}
          </div>
        </div>
        {error ? (
          <p className="rounded-lg bg-red-50 dark:bg-red-950/60 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2 sm:col-span-2">
          <button
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Saving..." : editingId ? "Save changes" : "Add label"}
          </button>
          {editingId ? (
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              onClick={() => {
                setEditingId(null);
                reset({ name: "", color: "#3b82f6" });
                setError(null);
              }}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <ul className="mt-5 space-y-2">
        {labels.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300/80 dark:border-slate-800 px-4 py-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
            No labels yet. Add your first one above.
          </li>
        ) : (
          paginatedLabels.map((label) => (
            <li
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 px-3.5 py-2.5"
              key={label.id}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{label.name}</span>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  onClick={() => startEdit(label)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60 cursor-pointer"
                  disabled={isPending}
                  onClick={() =>
                    run(() => deleteLabel(label.id), {
                      successMessage: "Label deleted successfully!",
                    })
                  }
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={labels.length}
        pageSize={pageSize}
      />
    </section>
  );
}