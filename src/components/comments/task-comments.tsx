"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { createComment, deleteComment, updateComment } from "@/app/actions/comments";
import { createCommentSchema } from "@/lib/schemas/commentSchema";
import type { Assignee, Comment } from "@/components/board/types";
import { useToast } from "@/components/toast-provider";
import { getInitials } from "@/lib/utils/initials";
import { MarkdownContent } from "@/lib/utils/markdown";
import { MentionAutocomplete } from "@/components/comments/mention-autocomplete";

const EDIT_WINDOW_MS = 5 * 60 * 1000;

type TaskCommentsProps = {
  taskId: string;
  comments: Comment[];
  currentUserId: string;
  role: "ADMIN" | "MEMBER";
  currentUserName: string | null;
  currentUserEmail: string;
  assignees?: Assignee[];
};

export function TaskComments({
  taskId,
  comments,
  currentUserId,
  role,
  currentUserName,
  currentUserEmail,
  assignees = [],
}: TaskCommentsProps) {
  const { showToast } = useToast();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  function runAction(action: () => Promise<unknown>, onSuccess?: () => void) {
    setError(null);
    setPending(true);
    startTransition(async () => {
      try {
        await action();
        onSuccess?.();
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Something went wrong. Please try again.",
        );
        showToast(
          caught instanceof Error ? caught.message : "Something went wrong. Please try again.",
          "error",
        );
      } finally {
        setPending(false);
      }
    });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
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

    startTransition(async () => {
      addOptimisticComment(optimistic);
      setDraft("");
      setMentionQuery(null);
      setError(null);
      try {
        await createComment({ taskId, content: parsed.data.content });
        showToast("Comment added!", "success");
      } catch (caught) {
        setDraft(parsed.data.content);
        showToast(
          caught instanceof Error ? caught.message : "Something went wrong. Please try again.",
          "error",
        );
      }
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
    runAction(
      () => updateComment({ commentId: comment.id, content: parsed.data.content }),
      () => {
        setEditingId(null);
        setEditingContent("");
        showToast("Comment updated!", "success");
      },
    );
  }

  return (
    <section aria-label="Comments" className="mt-6">
      <h3 className="text-base font-bold text-slate-900">
        Comments{" "}
        <span className="text-xs font-medium text-slate-400">({optimisticComments.length})</span>
      </h3>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-3 space-y-3">
        {optimisticComments.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300/80 px-4 py-6 text-center text-xs font-medium text-slate-400">
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
                className={`rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 ${
                  isOptimistic ? "opacity-70" : ""
                }`}
                key={comment.id}
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-bold text-slate-600">
                    {getInitials(comment.author.name ?? comment.author.email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {comment.author.name ?? comment.author.email}
                      </p>
                      <time className="shrink-0 text-[10px] font-medium text-slate-400">
                        {new Date(comment.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    {editingId === comment.id ? (
                      <div className="mt-1.5">
                        <textarea
                          className="min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          maxLength={2000}
                          onChange={(event) => setEditingContent(event.target.value)}
                          value={editingContent}
                        />
                        <div className="mt-1.5 flex gap-2">
                          <button
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                            disabled={pending}
                            onClick={() => saveEdit(comment)}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                            onClick={() => {
                              setEditingId(null);
                              setEditingContent("");
                            }}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-slate-700">
                        <MarkdownContent content={comment.content} />
                      </div>
                    )}
                    {!isOptimistic && (canEdit || canDelete) ? (
                      <div className="mt-2 flex gap-1">
                        {canEdit && editingId !== comment.id ? (
                          <button
                            className="rounded-md px-2 py-0.5 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            onClick={() => startEdit(comment)}
                            type="button"
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            className="rounded-md px-2 py-0.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
                            onClick={() =>
                              runAction(
                                () => deleteComment(comment.id),
                                () => showToast("Comment deleted!", "success"),
                              )
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

      <form className="relative mt-4 flex gap-2" onSubmit={onSubmit}>
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
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
          maxLength={2000}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="Write a comment... (Type @ to mention team members)"
          value={draft}
        />
        <button
          className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending || pending || draft.trim().length === 0}
          type="submit"
        >
          Post
        </button>
      </form>
    </section>
  );
}