import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { BoardTask } from "@/types/types";

export const getBoardTasks = cache(
  async (userId: string, role: "ADMIN" | "MEMBER"): Promise<BoardTask[]> => {
    const tasks = await prisma.task.findMany({
      where:
        role === "ADMIN"
          ? undefined
          : {
              assigneeId: userId,
            },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: { id: true, name: true, email: true },
        },
        labels: {
          select: {
            label: { select: { id: true, name: true, color: true } },
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          take: 50,
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return tasks.map((task) => ({
      ...task,
      dueDate: task.dueDate?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      labels: task.labels.map(({ label }) => label),
      comments: task.comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    }));
  }
);

export const getTaskById = cache(async (taskId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      assigneeId: true,
      createdById: true,
      assignee: {
        select: { id: true, name: true, email: true },
      },
      labels: {
        select: {
          label: { select: { id: true, name: true, color: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!task) return null;

  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    labels: task.labels.map(({ label }) => label),
    comments: task.comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    })),
  };
});
