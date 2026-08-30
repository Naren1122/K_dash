"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, CheckCircle2, AlertTriangle, ListTodo, ChevronDown, ChevronUp } from "lucide-react";
import { summarizeThreadAction } from "@/lib/actions/ai";
import { SparkleBadge } from "@/components/ui/sparkle-badge";
import type { Comment } from "@/lib/types/types";
import type { SummarizeThreadResponse } from "@/lib/schemas/aiSchema";

type ThreadSummaryCardProps = {
  taskId: string;
  taskTitle: string;
  taskDescription?: string | null;
  comments: Comment[];
};

export function ThreadSummaryCard({
  taskId,
  taskTitle,
  taskDescription,
  comments,
}: ThreadSummaryCardProps) {
  const [summary, setSummary] = useState<SummarizeThreadResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function handleSummarize() {
    if (comments.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await summarizeThreadAction({
        taskId,
        taskTitle,
        taskDescription,
        comments: comments.map((c) => ({
          id: c.id,
          authorName: c.author.name ?? c.author.email,
          content: c.content,
          createdAt: c.createdAt,
        })),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSummary(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to summarize thread.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  // If no summary exists yet, show a clean prompt banner/button
  if (!summary && !isGenerating && !error) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/30 p-3.5 shadow-2xs dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Summarize Discussion
              </h4>
              <SparkleBadge text="Gemini" size="sm" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Get an executive digest of decisions, blockers, and next actions from {comments.length} comments.
            </p>
          </div>
        </div>

        <button
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-500 active:scale-95 cursor-pointer"
          onClick={handleSummarize}
          type="button"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Summary
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-indigo-200 bg-white/95 shadow-sm transition-all dark:border-indigo-900/70 dark:bg-slate-900/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-pink-50/20 px-4 py-3 dark:border-indigo-950 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            AI Discussion Digest
          </h4>
          <SparkleBadge text="Gemini" size="sm" />
          {lastUpdated && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              • Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            aria-label="Refresh summary"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-300 disabled:opacity-50 cursor-pointer"
            disabled={isGenerating}
            onClick={handleSummarize}
            title="Refresh summary"
            type="button"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          <button
            aria-label={isExpanded ? "Collapse Summary" : "Expand Summary"}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-300 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {isGenerating ? (
            <div className="flex items-center justify-center py-6 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Synthesizing conversation...</span>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <p className="font-semibold">{error}</p>
              <button
                className="mt-2 inline-flex items-center gap-1 font-bold underline cursor-pointer"
                onClick={handleSummarize}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : summary ? (
            <div className="grid gap-3 text-xs md:grid-cols-3">
              {/* Consensus */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Consensus & Decisions</span>
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  {summary.consensus.length > 0 ? (
                    summary.consensus.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-slate-400">No major decisions recorded yet.</li>
                  )}
                </ul>
              </div>

              {/* Blockers */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-950 dark:bg-amber-950/20">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Blockers & Questions</span>
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  {summary.blockers.length > 0 ? (
                    summary.blockers.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-slate-400">No active blockers identified.</li>
                  )}
                </ul>
              </div>

              {/* Action Items */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3 dark:border-sky-950 dark:bg-sky-950/20">
                <div className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-300">
                  <ListTodo className="h-3.5 w-3.5 text-sky-600" />
                  <span>Action Items</span>
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  {summary.actionItems.length > 0 ? (
                    summary.actionItems.map((ai, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-sky-500 font-bold">•</span>
                        <span>
                          {ai.item}
                          {ai.assigneeName && (
                            <span className="ml-1 rounded-md bg-sky-100 px-1 py-0.2 text-[9px] font-semibold text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                              @{ai.assigneeName}
                            </span>
                          )}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-slate-400">No pending action items.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
