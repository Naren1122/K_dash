"use client";

import { useEffect, useOptimistic, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  createComment,
  deleteComment,
  getTaskCommentsAction,
  updateComment,
} from "@/lib/actions/comments";
import { createCommentSchema } from "@/lib/schemas/commentsSchema";
import type { Assignee, Comment } from "@/lib/types/types";
import { useActionRunner } from "@/hooks/useActionRunner";
import { ThreadSummaryCard } from "@/components/ai/thread-summary-card";
import { CommentItem } from "@/components/comments/comment-item";
import { CommentInputBox } from "@/components/comments/comment-input-box";

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
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [isLoading, setIsLoading] = useState(comments.length === 0);

  useEffect(() => {
    let isMounted = true;
    getTaskCommentsAction(taskId)
      .then((res) => {
        if (isMounted && res?.comments) {
          setLocalComments(res.comments);
        }
      })
      .catch((err) => {
        console.error("Failed to load comments:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [taskId]);

  const [optimisticComments, addOptimisticComment] = useOptimistic<Comment[], Comment>(
    localComments,
    (state, optimistic) => [...state, optimistic]
  );

  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const currentAuthor = { id: currentUserId, name: currentUserName, email: currentUserEmail };

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

    run(
      async () => {
        const created = await createComment({ taskId, content: parsed.data.content });
        if (created) {
          setLocalComments((prev) => [...prev, created]);
        }
        return created;
      },
      {
        optimistic: () => addOptimisticComment(optimistic),
        successMessage: "Comment added!",
        onError: () => {
          setDraft(savedDraft);
        },
      }
    );
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
    run(
      async () => {
        const updated = await updateComment({ commentId: comment.id, content: parsed.data.content });
        if (updated) {
          setLocalComments((prev) =>
            prev.map((c) =>
              c.id === comment.id
                ? { ...c, content: parsed.data.content, updatedAt: updated.updatedAt }
                : c
            )
          );
        }
        return updated;
      },
      {
        successMessage: "Comment updated!",
        onSuccess: () => {
          setEditingId(null);
          setEditingContent("");
        },
      }
    );
  }

  function onDeleteComment(commentId: string) {
    run(
      async () => {
        await deleteComment(commentId);
        setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
      },
      {
        successMessage: "Comment deleted!",
      }
    );
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

      <div className="mt-3">
        <ThreadSummaryCard
          taskId={taskId}
          taskTitle={taskTitle}
          taskDescription={taskDescription}
          comments={optimisticComments}
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-6 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-sky-500 mr-2" />
            Loading comments...
          </div>
        ) : optimisticComments.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No comments yet. Start the conversation!
          </p>
        ) : (
          <ul className="space-y-3">
            {optimisticComments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUserId={currentUserId}
                isAdmin={role === "ADMIN"}
                editingId={editingId}
                editingContent={editingContent}
                isPending={isPending}
                now={now}
                onStartEdit={startEdit}
                onCancelEdit={() => setEditingId(null)}
                onEditingContentChange={setEditingContent}
                onSaveEdit={saveEdit}
                onDelete={onDeleteComment}
              />
            ))}
          </ul>
        )}
      </div>

      <CommentInputBox
        draft={draft}
        isPending={isPending}
        assignees={assignees}
        onDraftChange={setDraft}
        onSubmit={onSubmit}
      />
    </section>
  );
}