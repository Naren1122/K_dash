"use client";

import { useEffect, useOptimistic, useState } from "react";

import { createComment, deleteComment, updateComment } from "@/lib/actions/comments";
import { createCommentSchema } from "@/lib/schemas/commentsSchema";
import type { Assignee, Comment } from "@/lib/types/types";
import { useActionRunner } from "@/hooks/useActionRunner";
import { getInitials } from "@/lib/utils/initials";
import { MarkdownContent } from "@/components/shared/markdown";
import { MentionAutocomplete } from "@/components/comments/mention-autocomplete";
import { ThreadSummaryCard } from "@/components/ai/thread-summary-card";

const EDIT_WINDOW_MS = 5 * 60 * 1000;

type TaskCommentsProps = {
  taskId: string;
  taskTitle?: string;
  taskDescription?: string | null;
  comments: Comment[];
  currentUserId: string;
  role: "ADMIN" | "MEMBER";
  currentUserName: string | null;
  currentUserEmail: string;
  assignees?: Assignee[];
};

export function TaskComments({
  taskId,
  taskTitle = "Task Discussion",
  taskDescription,
  comments,
  currentUserId,
  role,
  currentUserName,
  currentUserEmail,
  assignees = [],
}: TaskCommentsProps) {
  const { run, error, setError, isPending } = useActionRunner();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const [optimisticComments, addOptimisticComment] = useOptimistic<Comment[], Comment>(
    comments,
    (state, optimistic) => [...state, optimistic],
  );

  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const currentAuthor = { id: currentUserId, name: currentUserName, email: currentUserEmail };

  function handleInputChange(text: string) {
    setDraft(text);
    // Check if user is typing a mention `@`
    const lastAtIndex = text.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const charAfterAt = text.slice(lastAtIndex + 1);
      // If there's no space after `@`, show mention autocomplete
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
    setDraft(updatedDraft);
    setMentionQuery(null);
  }

  function onSubmit(event?: React.SyntheticEvent) {
    event?.preventDefault();
    const parsed = createCommentSchema.safeParse({ taskId, content: draft });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid comment");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const optimistic: Comment = {
      id: tempId,
      content: parsed.data.content,
      createdAt: timestamp,
      updatedAt: timestamp,
      author: currentAuthor,
    };

    const savedDraft = draft;
    setDraft("");
    setMentionQuery(null);

    run(() => createComment({ taskId, content: parsed.data.content }), {
      optimistic: () => addOptimisticComment(optimistic),
      successMessage: "Comment added!",
      onError: () => {
        setDraft(savedDraft);
      },
    });
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditingContent(comment.content);
    setError(null);
  }

  function saveEdit(comment: Comment) {
    const parsed = createCommentSchema.safeParse({ taskId, content: editingContent });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid comment");
      return;
    }
    run(() => updateComment({ commentId: comment.id, content: parsed.data.content }), {
      successMessage: "Comment updated!",
      onSuccess: () => {
        setEditingId(null);
        setEditingContent("");
      },
    });
  }

  return (
    <section aria-label="Comments" className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Comments
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {optimisticComments.length}
          </span>
        </h3>
      </div>

      {error ? (
        <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}

      {optimisticComments.length >= 2 ? (
        <div className="mt-3">
          <ThreadSummaryCard
            comments={optimisticComments}
            taskId={taskId}
            taskDescription={taskDescription}
            taskTitle={taskTitle}
          />
        </div>
      ) : null}

      <ul className="mt-3 space-y-3">
        {optimisticComments.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
            No comments yet. Start the conversation.
          </li>
        ) : (
          optimisticComments.map((comment) => {
            const isOptimistic = comment.id.startsWith("temp-");
            const isAuthor = comment.author.id === currentUserId;
            const canEdit = isAuthor && now - new Date(comment.createdAt).getTime() < EDIT_WINDOW_MS;
            const canDelete = isAuthor || role === "ADMIN";

            return (
              <li
                className={`rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-sky-50/20 p-3.5 shadow-2xs dark:border-slate-700 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800/60 ${isOptimistic ? "opacity-70" : ""
                  }`}
                key={comment.id}
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-sky-100 text-[10px] font-bold text-indigo-700 dark:from-indigo-950 dark:to-sky-950 dark:text-sky-300 border border-indigo-200/80 dark:border-indigo-800 shadow-2xs">
                    {getInitials(comment.author.name ?? comment.author.email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {comment.author.name ?? comment.author.email}
                      </p>
                      <time className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-400">
                        {new Date(comment.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    {editingId === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          maxLength={2000}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          value={editingContent}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                            onClick={() => setEditingId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                          <button
                            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-500 cursor-pointer disabled:opacity-50"
                            disabled={isPending || editingContent.trim().length === 0}
                            onClick={() => saveEdit(comment)}
                            type="button"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 break-words text-xs text-slate-700 dark:text-slate-300">
                        <MarkdownContent content={comment.content} />
                      </p>
                    )}

                    {editingId !== comment.id && (canEdit || canDelete) ? (
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {canEdit ? (
                          <button
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                            onClick={() => startEdit(comment)}
                            type="button"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canEdit && canDelete ? <span>•</span> : null}
                        {canDelete ? (
                          <button
                            className="hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            onClick={() =>
                              run(() => deleteComment({ commentId: comment.id }), {
                                successMessage: "Comment deleted!",
                              })
                            }
                            type="button"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="relative mt-4 flex gap-2">
        {mentionQuery !== null && assignees.length > 0 ? (
          <MentionAutocomplete
            assignees={assignees}
            filterText={mentionQuery}
            onClose={() => setMentionQuery(null)}
            onSelect={handleSelectMention}
          />
        ) : null}

        <label className="sr-only" htmlFor={`comment-${taskId}`}>
          Add a comment
        </label>
        <input
          id={`comment-${taskId}`}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition hover:border-slate-300 hover:bg-slate-50 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600 dark:placeholder:text-slate-400 dark:focus:bg-slate-800"
          maxLength={2000}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit(event);
            }
          }}
          placeholder="Write a comment... (Type @ to mention team members)"
          value={draft}
        />
        <button
          className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          disabled={isPending || draft.trim().length === 0}
          type="button"
          onClick={onSubmit}
        >
          Post
        </button>
      </div>
    </section>
  );
}