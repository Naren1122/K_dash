"use client";

import { useMemo, useState, useTransition } from "react";
import { createColumn, updateColumn, deleteColumn, reorderColumns } from "@/app/actions/columns";
import { useToast } from "@/components/toast-provider";
import { Pagination } from "@/components/ui/pagination";
import type { BoardColumn } from "@/components/board/column-types";

type ColumnManagerProps = {
  columns: BoardColumn[];
  boardId: string;
};

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  TODO: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
};

export function ColumnManager({ columns, boardId }: ColumnManagerProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(columns.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedColumns = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return columns.slice(start, start + pageSize);
  }, [columns, safePage, pageSize]);

  // Add column form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [newWipLimit, setNewWipLimit] = useState("");

  // Edit column state (per column)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWipLimit, setEditWipLimit] = useState("");

  function runAction(action: () => Promise<unknown>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        onSuccess?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        showToast(msg, "error");
      }
    });
  }

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    runAction(
      () =>
        createColumn({
          name: newName.trim(),
          status: newStatus,
          wipLimit: newWipLimit ? parseInt(newWipLimit, 10) || null : null,
          boardId,
        }),
      () => {
        setNewName("");
        setNewWipLimit("");
        setShowAddForm(false);
        showToast("Column created!", "success");
      },
    );
  }

  function startEdit(col: BoardColumn) {
    setEditingId(col.id);
    setEditName(col.name);
    setEditWipLimit(col.wipLimit !== null ? String(col.wipLimit) : "");
  }

  function handleSaveEdit(col: BoardColumn) {
    runAction(
      () =>
        updateColumn({
          columnId: col.id,
          name: editName.trim() || col.name,
          wipLimit: editWipLimit ? parseInt(editWipLimit, 10) || null : null,
        }),
      () => {
        setEditingId(null);
        showToast("Column updated!", "success");
      },
    );
  }

  function handleDelete(columnId: string) {
    runAction(
      () => deleteColumn(columnId),
      () => showToast("Column deleted!", "success"),
    );
  }

  function handleMoveUp(colId: string) {
    const index = columns.findIndex((c) => c.id === colId);
    if (index <= 0) return;
    const reordered = [...columns];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    runAction(
      () => reorderColumns({ boardId, columnIds: reordered.map((c) => c.id) }),
      () => showToast("Columns reordered!", "success"),
    );
  }

  function handleMoveDown(colId: string) {
    const index = columns.findIndex((c) => c.id === colId);
    if (index < 0 || index >= columns.length - 1) return;
    const reordered = [...columns];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    runAction(
      () => reorderColumns({ boardId, columnIds: reordered.map((c) => c.id) }),
      () => showToast("Columns reordered!", "success"),
    );
  }

  return (
    <section aria-label="Column Workflow Manager" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Workflow Columns</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Manage columns, map task statuses, and set WIP limits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            {columns.length}
          </span>
          <button
            type="button"
            onClick={() => setShowAddForm((p) => !p)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700 dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer disabled:opacity-60"
          >
            {showAddForm ? "✕ Cancel" : "+ Add Column"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {/* Add column form */}
      {showAddForm ? (
        <form
          onSubmit={handleAddColumn}
          className="mt-4 grid gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-800/40"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Column Name
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={50}
                placeholder="e.g. Review"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-950"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Maps to Status
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              WIP Limit (optional)
              <input
                type="number"
                min={1}
                value={newWipLimit}
                onChange={(e) => setNewWipLimit(e.target.value)}
                placeholder="e.g. 5"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-950"
              />
            </label>
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 cursor-pointer disabled:opacity-60"
            >
              {isPending ? "Creating..." : "Create Column"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Columns list */}
      <div className="mt-4 space-y-2">
        {columns.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300/80 dark:border-slate-800 px-4 py-8 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
            No columns configured. Add one above.
          </p>
        ) : null}
        {paginatedColumns.map((col) => {
          const originalIndex = columns.findIndex((c) => c.id === col.id);
          return (
            <div
              key={col.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={isPending || originalIndex === 0}
                  onClick={() => handleMoveUp(col.id)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-xs leading-none cursor-pointer"
                  aria-label="Move column up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={isPending || originalIndex === columns.length - 1}
                  onClick={() => handleMoveDown(col.id)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-xs leading-none cursor-pointer"
                  aria-label="Move column down"
                >
                  ▼
                </button>
              </div>

              {/* Column info / edit */}
              <div className="flex-1 min-w-0">
                {editingId === col.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={50}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white w-40"
                    />
                    <input
                      type="number"
                      min={1}
                      value={editWipLimit}
                      onChange={(e) => setEditWipLimit(e.target.value)}
                      placeholder="WIP limit"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white w-28"
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{col.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[col.status] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {col.status.replace("_", " ")}
                    </span>
                    {col.wipLimit !== null ? (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        WIP: {col.wipLimit}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {editingId === col.id ? (
                  <>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSaveEdit(col)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => startEdit(col)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(col.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60 transition cursor-pointer disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={columns.length}
        pageSize={pageSize}
      />
    </section>
  );
}
