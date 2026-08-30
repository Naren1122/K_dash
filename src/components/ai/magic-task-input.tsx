"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { generateTaskFromPromptAction } from "@/lib/actions/ai";
import { SparkleBadge } from "@/components/ui/sparkle-badge";
import type { Assignee, Label } from "@/lib/types/types";
import type { MagicTaskResponse } from "@/lib/schemas/aiSchema";

type MagicTaskInputProps = {
  assignees: Assignee[];
  labels: Label[];
  onPopulate: (taskData: MagicTaskResponse) => void;
};

const PROMPT_SUGGESTIONS = [
  "Fix session timeout bug on mobile by next Friday, High priority, add Bug label",
  "Design landing page dark mode hero section, mark as Critical",
  "Write automated test suite for Stripe billing webhooks, due in 3 days",
];

export function MagicTaskInput({ assignees, labels, onPopulate }: MagicTaskInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [successFlash, setSuccessFlash] = useState(false);

  async function handleGenerate(customPrompt?: string) {
    const textToUse = customPrompt ?? prompt;
    if (!textToUse || textToUse.trim().length < 2) {
      setError("Please enter a short description of your task.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateTaskFromPromptAction({
        prompt: textToUse.trim(),
        assignees: assignees.map((a) => ({ id: a.id, name: a.name, email: a.email })),
        labels: labels.map((l) => ({ id: l.id, name: l.name })),
        currentDate: new Date().toISOString(),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onPopulate(result.data);
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 2000);
      setPrompt("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate task with AI.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-pink-50/30 p-4 shadow-xs transition-all dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                Magic Task Creator
              </h4>
              <SparkleBadge text="Gemini" size="sm" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Type in natural language to auto-populate title, priority, dates, assignees & labels.
            </p>
          </div>
        </div>

        <button
          aria-label={isOpen ? "Collapse Magic Creator" : "Expand Magic Creator"}
          className="rounded-lg p-1 text-slate-400 hover:bg-indigo-100/60 dark:text-slate-500 dark:hover:bg-slate-800 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-2.5">
          <div className="relative flex items-center">
            <input
              className="w-full rounded-xl border border-indigo-200 bg-white/90 py-2.5 pl-3.5 pr-28 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-100 dark:border-indigo-800/80 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-950 disabled:opacity-60"
              disabled={isGenerating}
              maxLength={500}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Refactor login page by Thursday, High priority, assign to Maya, add Bug label"
              value={prompt}
            />
            <button
              aria-label="Generate Task from Natural Language"
              className="absolute right-1.5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              disabled={isGenerating || prompt.trim().length === 0}
              onClick={() => handleGenerate()}
              type="button"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Try:
            </span>
            {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                className="rounded-lg border border-indigo-200/70 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-indigo-900 transition hover:border-indigo-400 hover:bg-indigo-100/80 dark:border-indigo-900/60 dark:bg-slate-900/80 dark:text-indigo-300 dark:hover:bg-indigo-950/60 cursor-pointer text-left"
                disabled={isGenerating}
                onClick={() => {
                  setPrompt(suggestion);
                  handleGenerate(suggestion);
                }}
                type="button"
              >
                {suggestion.slice(0, 45)}...
              </button>
            ))}
          </div>

          {successFlash && (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 animate-in fade-in">
              <span>✨ Task fields auto-populated successfully! Review and submit below.</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300" role="alert">
              <span>{error}</span>
              <button
                className="text-[10px] font-bold underline cursor-pointer"
                onClick={() => setError(null)}
                type="button"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
