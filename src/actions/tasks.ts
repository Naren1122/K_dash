"use server";

import { cache } from "react";
import { z } from "zod";
import { Role } from "@/types/prisma";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  createTaskSchema,
  CreateTaskInput,
  taskIdSchema,
  taskStatusSchema,
  updateTaskSchema,
  UpdateTaskStatusInput,
  ReassignTaskInput,
} from "@/lib/schemas/tasksSchema";
import { logger } from "@/utils/logger";
import {
  ActionError,
  getCurrentUser,
  getTaskOrThrow,
  parseOrThrow,
  requireAdmin,
} from "@/utils/action-utils";
import type { BoardTask } from "@/types/types";

import { createActivityLog } from "@/actions/activity";
import { notifyTaskStakeholders } from "@/actions/notifications";

const actionLogger = logger.action.bind(logger);

export async function getBoardTasks(
  userId: string,
  role: "ADMIN" | "MEMBER"
): Promise<BoardTask[]> {
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

export async function getTaskById(taskId: string) {
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
}

async function assertMemberOwnsTask(userId: string, task: { assigneeId: string | null }) {
  if (task.assigneeId !== userId) {
    actionLogger("ownership_check_failed", { userId, taskAssigneeId: task.assigneeId });
    throw new ActionError(403, "Members can only update tasks assigned to them");
  }
}

async function assertAssigneeIsMember(assigneeId: string) {
  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { role: true },
  });

  if (!assignee || assignee.role !== Role.MEMBER) {
    actionLogger("assignee_validation_failed", { assigneeId, role: assignee?.role });
    throw new ActionError(400, "Tasks can only be assigned to members");
  }
}

const updateTaskInputSchema = updateTaskSchema.extend({
  taskId: taskIdSchema,
});

type UpdateTaskData = z.infer<typeof updateTaskInputSchema>;

function pickUpdatableFields(
  data: UpdateTaskData,
  isAdmin: boolean,
): Partial<Omit<UpdateTaskData, "taskId" | "labelIds">> {
  const { title, description, assigneeId, dueDate, priority } = data;

  const patch: Partial<Omit<UpdateTaskData, "taskId" | "labelIds">> = {};

  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;
  if (assigneeId !== undefined) patch.assigneeId = assigneeId;
  if (dueDate !== undefined) patch.dueDate = dueDate;
  if (isAdmin && priority !== undefined) patch.priority = priority;

  return patch;
}

export async function createTask(input: CreateTaskInput) {
  const user = await requireAdmin();
  const { title, description, assigneeId, priority, dueDate, labelIds } =
    parseOrThrow(createTaskSchema, input);

  if (assigneeId) {
    await assertAssigneeIsMember(assigneeId);
  }

  actionLogger("create_task_start", { userId: user.id, title, assigneeId, priority, dueDate });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      assigneeId,
      priority,
      dueDate,
      createdById: user.id,
      labels: {
        create: labelIds.map((labelId) => ({ labelId })),
      },
    },
    select: { id: true },
  });

  await createActivityLog({
    taskId: task.id,
    userId: user.id,
    action: "CREATED",
  });

  await notifyTaskStakeholders(task.id, "TASK_ASSIGNED", {
    taskId: task.id,
    taskTitle: title,
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Admin"} created task "${title}"`,
  });

  if (dueDate) {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueObj = new Date(dueDate);
    if (dueObj <= oneDayLater) {
      const diffMs = dueObj.getTime() - now.getTime();
      const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));
      const message = hoursLeft <= 0
        ? `Deadline alert: "${title}" is due today!`
        : hoursLeft <= 24
        ? `Deadline alert: "${title}" is due in ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"} (less than 24h left)!`
        : `Deadline alert: "${title}" is due tomorrow!`;

      await notifyTaskStakeholders(task.id, "TASK_DUE_SOON", {
        taskId: task.id,
        taskTitle: title,
        actorId: user.id,
        actorName: (user.name || user.email || undefined) as string | undefined,
        message,
      });
    }
  }

  actionLogger("create_task_success", { taskId: task.id });
  revalidatePath("/board");
  revalidatePath("/");
  const fullTask = await getTaskById(task.id);
  return fullTask;
}

export async function updateTask(input: unknown) {
  const user = await getCurrentUser();
  const data = parseOrThrow(updateTaskInputSchema, input);
  const { taskId, labelIds } = data;

  actionLogger("update_task_start", { taskId, userId: user.id });

  const current = await getTaskOrThrow(taskId);

  if (user.role === Role.MEMBER) {
    await assertMemberOwnsTask(user.id, current);
  }

  if (data.assigneeId) {
    await assertAssigneeIsMember(data.assigneeId);
  }

  const patch = pickUpdatableFields(data, user.role === Role.ADMIN);

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...patch,
      ...(labelIds !== undefined && {
        labels: {
          deleteMany: {},
          create: labelIds.map((labelId: string) => ({ labelId })),
        },
      }),
    },
    select: { id: true },
  });

  await createActivityLog({
    taskId,
    userId: user.id,
    action: "UPDATED",
  });

  await notifyTaskStakeholders(taskId, "TASK_ASSIGNED", {
    taskId,
    taskTitle: current.title,
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Someone"} updated task "${current.title}"`,
  });

  if (data.dueDate) {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueObj = new Date(data.dueDate);
    if (dueObj <= oneDayLater) {
      const diffMs = dueObj.getTime() - now.getTime();
      const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));
      const message = hoursLeft <= 0
        ? `Deadline alert: "${current.title}" is due today!`
        : hoursLeft <= 24
        ? `Deadline alert: "${current.title}" is due in ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"} (less than 24h left)!`
        : `Deadline alert: "${current.title}" is due tomorrow!`;

      await notifyTaskStakeholders(taskId, "TASK_DUE_SOON", {
        taskId,
        taskTitle: current.title,
        actorId: user.id,
        actorName: (user.name || user.email || undefined) as string | undefined,
        message,
      });
    }
  }

  actionLogger("update_task_success", { taskId });
  revalidatePath("/board");
  revalidatePath("/");
  const fullTask = await getTaskById(taskId);
  return fullTask;
}

export async function updateTaskStatus(input: UpdateTaskStatusInput) {
  const user = await getCurrentUser();
  const { taskId, status } = parseOrThrow(
    z.object({ taskId: taskIdSchema, status: taskStatusSchema }),
    input,
  );

  actionLogger("update_task_status_start", { taskId, status, userId: user.id });

  const current = await getTaskOrThrow(taskId);

  if (user.role === Role.MEMBER) {
    await assertMemberOwnsTask(user.id, current);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    select: { id: true, status: true },
  });

  await createActivityLog({
    taskId,
    userId: user.id,
    action: "STATUS_CHANGED",
    field: "status",
    oldValue: current.status,
    newValue: status,
  });

  await notifyTaskStakeholders(taskId, "TASK_STATUS_CHANGED", {
    taskId,
    taskTitle: current.title,
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Someone"} changed status of "${current.title}" to ${status}`,
  });

  actionLogger("update_task_status_success", { taskId, status });
  revalidatePath("/board");
  revalidatePath("/");
  return updated;
}

export async function reassignTask(input: ReassignTaskInput) {
  const user = await requireAdmin();
  const { taskId, assigneeId } = parseOrThrow(
    z.object({
      taskId: taskIdSchema,
      assigneeId: z.string().trim().min(1, "Assignee ID is required"),
    }),
    input,
  );

  await assertAssigneeIsMember(assigneeId);

  actionLogger("reassign_task_start", { taskId, assigneeId });

  const current = await getTaskOrThrow(taskId);

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    select: { id: true, assigneeId: true },
  });

  await createActivityLog({
    taskId,
    userId: user.id,
    action: "REASSIGNED",
    field: "assigneeId",
    oldValue: current.assigneeId ?? undefined,
    newValue: assigneeId,
  });

  await notifyTaskStakeholders(taskId, "TASK_ASSIGNED", {
    taskId,
    taskTitle: current.title,
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Admin"} assigned task "${current.title}"`,
  });

  actionLogger("reassign_task_success", { taskId, assigneeId });
  revalidatePath("/board");
  revalidatePath("/");
  const fullTask = await getTaskById(taskId);
  return fullTask;
}

export async function deleteTask(taskId: unknown) {
  const user = await requireAdmin();
  const id = parseOrThrow(taskIdSchema, taskId);

  actionLogger("delete_task_start", { taskId: id });

  const task = await getTaskOrThrow(id);

  await notifyTaskStakeholders(id, "TASK_STATUS_CHANGED", {
    taskId: id,
    taskTitle: task.title,
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Admin"} deleted task "${task.title}"`,
  });

  await prisma.task.delete({ where: { id } });

  actionLogger("delete_task_success", { taskId: id });
  revalidatePath("/board");
  revalidatePath("/");
}
