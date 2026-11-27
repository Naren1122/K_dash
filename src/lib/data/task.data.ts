import { prisma } from "@/lib/utils/prisma";
import type { Prisma, Role } from "@/lib/types/prisma_type";
import type { BoardTask } from "@/lib/types/types";
import { assigneeSelect, userSummarySelect } from "@/lib/types/types";
import type { CreateTaskInput, TaskStatusValue } from "@/lib/schemas/tasksSchema";

export const boardTaskSelect = {
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
    select: assigneeSelect,
  },
  labels: {
    select: {
      label: { select: { id: true, name: true, color: true } },
    },
  },
} as const;

export const taskDetailSelect = {
  ...boardTaskSelect,
  comments: {
    orderBy: { createdAt: "asc" as const },
    take: 50,
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: { select: userSummarySelect },
    },
  },
} as const;

export type BoardTaskRaw = Prisma.TaskGetPayload<{ select: typeof boardTaskSelect }>;
export type TaskDetailRaw = Prisma.TaskGetPayload<{ select: typeof taskDetailSelect }>;

export function formatBoardTaskDto(task: BoardTaskRaw): BoardTask {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    labels: task.labels.map(({ label }) => label),
    comments: [],
  };
}

export function formatTaskDetailDto(task: TaskDetailRaw): BoardTask {
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
}

export async function findBoardTasksInDb(
  userId: string,
  role: Role | "ADMIN" | "MEMBER"
): Promise<BoardTask[]> {
  const tasks = await prisma.task.findMany({
    where:
      role === "ADMIN"
        ? undefined
        : {
            assigneeId: userId,
          },
    orderBy: { updatedAt: "desc" },
    select: boardTaskSelect,
  });

  return tasks.map(formatBoardTaskDto);
}

export async function findTaskByIdInDb(taskId: string): Promise<BoardTask | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: taskDetailSelect,
  });

  if (!task) return null;
  return formatTaskDetailDto(task);
}

export async function findTaskOwnerInDb(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, assigneeId: true, createdById: true, status: true, title: true },
  });
}

export async function createTaskInDb(
  input: CreateTaskInput,
  createdById: string
): Promise<BoardTask> {
  const created = await prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: "TODO",
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assigneeId: input.assigneeId || null,
      createdById,
      labels: input.labelIds?.length
        ? {
            create: input.labelIds.map((labelId) => ({
              label: { connect: { id: labelId } },
            })),
          }
        : undefined,
    },
    select: boardTaskSelect,
  });

  return formatBoardTaskDto(created);
}

export async function updateTaskInDb(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    status?: TaskStatusValue;
    priority?: CreateTaskInput["priority"];
    dueDate?: Date | null;
    assigneeId?: string | null;
    labelIds?: string[];
  }
): Promise<BoardTask> {
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
      ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId || null } : {}),
      ...(data.labelIds !== undefined
        ? {
            labels: {
              deleteMany: {},
              create: data.labelIds.map((labelId) => ({
                label: { connect: { id: labelId } },
              })),
            },
          }
        : {}),
    },
    select: boardTaskSelect,
  });

  return formatBoardTaskDto(updated);
}

export async function updateTaskStatusInDb(
  taskId: string,
  status: TaskStatusValue
): Promise<BoardTask> {
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    select: boardTaskSelect,
  });

  return formatBoardTaskDto(updated);
}

export async function reassignTaskInDb(
  taskId: string,
  assigneeId: string | null
): Promise<BoardTask> {
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    select: boardTaskSelect,
  });

  return formatBoardTaskDto(updated);
}

export async function deleteTaskInDb(taskId: string): Promise<void> {
  await prisma.task.delete({
    where: { id: taskId },
  });
}
