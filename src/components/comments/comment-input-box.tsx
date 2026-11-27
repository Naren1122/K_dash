"use client";

import { useState } from "react";
import type { Assignee } from "@/lib/types/types";
import { MentionAutocomplete } from "@/components/comments/mention-autocomplete";

interface CommentInputBoxProps {
  draft: string;
  isPending: boolean;
  assignees: Assignee[];
  onDraftChange: (text: string) => void;
  onSubmit: (e?: React.SyntheticEvent) => void;
}

export function CommentInputBox({
  draft,
  isPending,
  assignees,
  onDraftChange,
  onSubmit,
}: CommentInputBoxProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  function handleTextChange(text: string) {
    onDraftChange(text);
    const lastAtIndex = text.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const charAfterAt = text.slice(lastAtIndex + 1);
      if (!charAfterAt.includes(" ")) {
        setMentionQuery(charAfterAt);
        return;
      }
    }
    setMentionQuery(null);
  }

  function handleSelectMention(user: Assignee) {
    if (mentionQuery === null) return;
    const lastAtIndex = draft.lastIndexOf("@");
    const nameToInsert = `@${user.name ?? user.email} `;
    const updatedDraft = draft.slice(0, lastAtIndex) + nameToInsert;
    onDraftChange(updatedDraft);
    setMentionQuery(null);
  }

  return (
    <form onSubmit={onSubmit} className="relative mt-4 space-y-2">
      <div className="relative">
        <textarea
          value={draft}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Write a comment... (use @ to mention teammates)"
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-950/60"
        />

        {mentionQuery !== null && (
          <MentionAutocomplete
            filterText={mentionQuery}
            assignees={assignees}
            onSelect={handleSelectMention}
            onClose={() => setMentionQuery(null)}
          />
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600 cursor-pointer"
        >
          {isPending ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
}
