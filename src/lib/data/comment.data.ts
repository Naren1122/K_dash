import { prisma } from "@/lib/utils/prisma";
import { userSummarySelect } from "@/lib/types/types";

export const commentDetailSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: userSummarySelect,
  },
} as const;

export async function findCommentsByTaskIdInDb(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: commentDetailSelect,
  });
}

export async function findCommentByIdInDb(commentId: string) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      taskId: true,
      createdAt: true,
      content: true,
    },
  });
}

export async function createCommentInDb(data: {
  content: string;
  taskId: string;
  authorId: string;
}) {
  return prisma.comment.create({
    data: {
      content: data.content,
      taskId: data.taskId,
      authorId: data.authorId,
    },
    select: commentDetailSelect,
  });
}

export async function updateCommentInDb(commentId: string, content: string) {
  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    select: { id: true, content: true, updatedAt: true },
  });
}

export async function deleteCommentInDb(commentId: string) {
  return prisma.comment.delete({
    where: { id: commentId },
  });
}
