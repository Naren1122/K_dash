"use client";

import { useEffect, useState, startTransition } from "react";
import { Sparkles, Loader2, CheckSquare, Square, X, ArrowDownToLine, RefreshCw } from "lucide-react";
import { decomposeTaskAction } from "@/lib/actions/ai";
import { SparkleBadge } from "@/components/ui/sparkle-badge";
import type { DecomposedSubtask, SubtaskEffort } from "@/lib/schemas/aiSchema";

type TaskDecomposerModalProps = {
  taskId?: string;
  taskTitle: string;
  taskDescription: string | null;
  priority?: string;
  isOpen: boolean;
  onClose: () => void;
  onInsertChecklist: (formattedChecklist: string) => void;
};

export function TaskDecomposerModal({
  taskId,
  taskTitle,
  taskDescription,
  priority = "MEDIUM",
  isOpen,
  onClose,
  onInsertChecklist,
}: TaskDecomposerModalProps) {
  const [subtasks, setSubtasks] = useState<DecomposedSubtask[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    startTransition(() => {
      setIsGenerating(true);
      setError(null);
    });

    async function run() {
      try {
        const result = await decomposeTaskAction({
          taskId,
          title: taskTitle,
          description: taskDescription,
          priority: (priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || "MEDIUM",
        });

        if (!ignore) {
          if (!result.success) {
            startTransition(() => {
              setError(result.error);
              setIsGenerating(false);
            });
            return;
          }

          startTransition(() => {
            setSummary(result.data.summary);
            setSubtasks(result.data.subtasks);
            setSelectedIndices(new Set(result.data.subtasks.map((_, i) => i)));
            setIsGenerating(false);
          });
        }
      } catch (err) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Failed to decompose task.";
          startTransition(() => {
            setError(message);
            setIsGenerating(false);
          });
        }
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [isOpen, taskId, taskTitle, taskDescription, priority]);

  async function handleRegenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await decomposeTaskAction({
        taskId,
        title: taskTitle,
        description: taskDescription,
        priority: (priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || "MEDIUM",
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSummary(result.data.summary);
      setSubtasks(result.data.subtasks);
      setSelectedIndices(new Set(result.data.subtasks.map((_, i) => i)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to decompose task.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function toggleSubtask(index: number) {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  }

  function toggleAll() {
    if (selectedIndices.size === subtasks.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(subtasks.map((_, i) => i)));
    }
  }

  function handleInsert() {
    const selectedSubtasks = subtasks.filter((_, i) => selectedIndices.has(i));
    if (selectedSubtasks.length === 0) return;

    const checklistMarkdown = selectedSubtasks
      .map((st) => `- [ ] **${st.title}** — ${st.acceptanceCriteria}`)
      .join("\n");

    onInsertChecklist(checklistMarkdown);
    onClose();
  }

  function getEffortBadge(effort: SubtaskEffort) {
    switch (effort) {
      case "QUICK_WIN":
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Quick Win
          </span>
        );
      case "COMPLEX":
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Complex
          </span>
        );
      case "STANDARD":
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Standard
          </span>
        );
    }
  }

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="decomposer-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
      role="dialog"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-indigo-200/80 bg-white/95 shadow-2xl backdrop-blur-2xl transition-all dark:border-indigo-900/80 dark:bg-slate-900/95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-950/80 p-4 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white" id="decomposer-modal-title">
                  AI Task Decomposer
                </h3>
                <SparkleBadge text="Gemini" size="sm" />
              </div>
              <p className="truncate max-w-[320px] text-[11px] text-slate-500 dark:text-slate-400">
                {taskTitle}
              </p>
            </div>
          </div>
          <button
            aria-label="Close Decomposer"
            className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Decomposing task with Gemini AI...
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Analyzing scope and generating actionable acceptance checklists.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs dark:border-rose-900/60 dark:bg-rose-950/40">
              <p className="font-semibold text-rose-800 dark:text-rose-300">{error}</p>
              <button
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-rose-500 cursor-pointer"
                onClick={handleRegenerate}
                type="button"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          ) : subtasks.length > 0 ? (
            <>
              {summary && (
                <div className="rounded-xl bg-indigo-50/70 p-3 text-xs text-indigo-900 border border-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
                  <span className="font-semibold">Strategy: </span>
                  {summary}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Generated Subtasks ({selectedIndices.size}/{subtasks.length} selected)
                </span>
                <button
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
                  onClick={toggleAll}
                  type="button"
                >
                  {selectedIndices.size === subtasks.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="space-y-2">
                {subtasks.map((st, idx) => {
                  const isSelected = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer select-none ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50/50 shadow-2xs dark:border-indigo-700 dark:bg-indigo-950/30"
                          : "border-slate-200 bg-white opacity-70 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900/80"
                      }`}
                      onClick={() => toggleSubtask(idx)}
                    >
                      <button
                        aria-label={isSelected ? "Uncheck subtask" : "Check subtask"}
                        className="mt-0.5 text-indigo-600 dark:text-indigo-400"
                        type="button"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {st.title}
                          </p>
                          {getEffortBadge(st.estimatedEffort)}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                          {st.acceptanceCriteria}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 cursor-pointer"
              disabled={isGenerating}
              onClick={handleRegenerate}
              type="button"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>

            <button
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              disabled={isGenerating || selectedIndices.size === 0}
              onClick={handleInsert}
              type="button"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Insert {selectedIndices.size > 0 ? `(${selectedIndices.size})` : ""} into Description
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
