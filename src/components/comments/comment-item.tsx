"use client";

import type { Comment } from "@/lib/types/types";
import { getInitials } from "@/lib/utils/initials";
import { MarkdownContent } from "@/components/shared/markdown";

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  isAdmin: boolean;
  editingId: string | null;
  editingContent: string;
  isPending: boolean;
  now: number;
  onStartEdit: (comment: Comment) => void;
  onCancelEdit: () => void;
  onEditingContentChange: (content: string) => void;
  onSaveEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
}

const EDIT_WINDOW_MS = 5 * 60 * 1000;

export function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  editingId,
  editingContent,
  isPending,
  now,
  onStartEdit,
  onCancelEdit,
  onEditingContentChange,
  onSaveEdit,
  onDelete,
}: CommentItemProps) {
  const isAuthor = comment.author.id === currentUserId;
  const canDelete = isAuthor || isAdmin;
  const createdAtMs = new Date(comment.createdAt).getTime();
  const isWithinEditWindow = now - createdAtMs <= EDIT_WINDOW_MS;
  const canEdit = isAuthor && isWithinEditWindow;
  const isEditing = editingId === comment.id;

  return (
    <li className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/10 text-[11px] font-bold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
            {getInitials(comment.author.name || comment.author.email)}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {comment.author.name || comment.author.email}
            </span>
            <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500">
              {new Date(comment.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {canDelete && !isEditing ? (
          <div className="flex items-center gap-1.5">
            {canEdit && (
              <button
                type="button"
                onClick={() => onStartEdit(comment)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={editingContent}
            onChange={(e) => onEditingContentChange(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSaveEdit(comment)}
              disabled={isPending || !editingContent.trim()}
              className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-sky-500 disabled:opacity-50 cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <MarkdownContent content={comment.content} />
        </div>
      )}
    </li>
  );
}
