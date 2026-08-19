"use server";

import { revalidatePath } from "next/cache";

import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/types/prisma";
import {
  commentIdSchema,
  createCommentSchema,
  CreateCommentInput,
  updateCommentSchema,
  UpdateCommentInput,
} from "@/lib/schemas/commentSchema";
import { logger } from "@/lib/utils/logger";
import { ActionError, getCurrentUser, getTaskOrThrow, parseOrThrow } from "@/lib/utils/action-utils";

import { createActivityLog } from "@/lib/data/activity";
import { createNotification } from "@/lib/data/notifications";

const actionLogger = logger.action.bind(logger);

const COMMENT_EDIT_WINDOW_MS = 5 * 60 * 1000;

export async function createComment(input: CreateCommentInput) {
  const user = await getCurrentUser();
  const { taskId, content } = parseOrThrow(createCommentSchema, input);
  const task = await getTaskOrThrow(taskId);

  actionLogger("create_comment_start", { taskId, userId: user.id });

  const comment = await prisma.comment.create({
    data: { content, taskId, authorId: user.id },
    select: { id: true, content: true, createdAt: true },
  });

  await createActivityLog({
    taskId,
    userId: user.id,
    action: "COMMENTED",
    newValue: content.slice(0, 100),
  });

  if (task.assigneeId) {
    await createNotification(task.assigneeId, "TASK_COMMENTED", {
      taskId,
      taskTitle: task.title,
      actorId: user.id,
      actorName: (user.name || user.email || undefined) as string | undefined,
      message: `Commented: "${content.slice(0, 50)}..."`,
    });
  }

  actionLogger("create_comment_success", { commentId: comment.id, taskId });
  revalidatePath("/");
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  };
}

export async function updateComment(input: UpdateCommentInput) {
  const user = await getCurrentUser();
  const { commentId, content } = parseOrThrow(updateCommentSchema, input);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, createdAt: true },
  });

  if (!comment) {
    actionLogger("comment_not_found", { commentId });
    throw new ActionError(404, "Comment not found");
  }

  if (comment.authorId !== user.id) {
    actionLogger("comment_permission_failed", { commentId, userId: user.id });
    throw new ActionError(403, "Only the author can edit this comment");
  }

  const ageMs = Date.now() - comment.createdAt.getTime();
  if (ageMs > COMMENT_EDIT_WINDOW_MS) {
    actionLogger("comment_edit_window_expired", { commentId, ageMs });
    throw new ActionError(400, "Comments can only be edited within 5 minutes of posting");
  }

  actionLogger("update_comment_start", { commentId, userId: user.id });

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    select: { id: true, content: true, updatedAt: true },
  });

  actionLogger("update_comment_success", { commentId });
  revalidatePath("/");
  return {
    ...updated,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteComment(commentId: unknown) {
  const user = await getCurrentUser();
  const id = parseOrThrow(commentIdSchema, commentId);

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  });

  if (!comment) {
    actionLogger("comment_not_found", { commentId: id });
    throw new ActionError(404, "Comment not found");
  }

  if (comment.authorId !== user.id && user.role !== Role.ADMIN) {
    actionLogger("comment_delete_permission_failed", { commentId: id, userId: user.id });
    throw new ActionError(403, "Only the author or an administrator can delete this comment");
  }

  actionLogger("delete_comment_start", { commentId: id, userId: user.id });
  await prisma.comment.delete({ where: { id } });
  actionLogger("delete_comment_success", { commentId: id });
  revalidatePath("/");
}