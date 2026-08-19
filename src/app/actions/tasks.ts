"use server";

import { z } from "zod";
import { Role } from "../../generated/prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/types/prisma";
import {
  createTaskSchema,
  CreateTaskInput,
  taskIdSchema,
  taskStatusSchema,
  updateTaskSchema,
  UpdateTaskStatusInput,
  ReassignTaskInput,
} from "@/lib/schemas/taskSchema";
import { logger } from "@/lib/utils/logger";
import {
  ActionError,
  getCurrentUser,
  getTaskOrThrow,
  parseOrThrow,
  requireAdmin,
} from "@/lib/utils/action-utils";

import { createActivityLog } from "@/lib/data/activity";
import { createNotification } from "@/lib/data/notifications";

const actionLogger = logger.action.bind(logger);

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
    newValue: title,
  });

  if (assigneeId) {
    await createNotification(assigneeId, "TASK_ASSIGNED", {
      taskId: task.id,
      taskTitle: title,
      actorId: user.id,
      actorName: (user.name || user.email || undefined) as string | undefined,
      message: `Assigned task "${title}" to you`,
    });
  }

  actionLogger("create_task_success", { taskId: task.id, userId: user.id });
  revalidatePath("/");
  return task;
}

export async function updateTask(input: UpdateTaskData) {
  const user = await getCurrentUser();
  const data = parseOrThrow(updateTaskInputSchema, input);
  const task = await getTaskOrThrow(data.taskId);

  if (user.role === Role.MEMBER) {
    await assertMemberOwnsTask(user.id, task);
  }

  const isAdmin = user.role === Role.ADMIN;
  const patch = pickUpdatableFields(data, isAdmin);

  if (patch.assigneeId && isAdmin) {
    await assertAssigneeIsMember(patch.assigneeId);
  }

  actionLogger("update_task_start", { taskId: task.id, userId: user.id, fields: Object.keys(patch) });

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...patch,
      labels:
        data.labelIds !== undefined
          ? {
            deleteMany: {},
            create: data.labelIds.map((labelId) => ({ labelId })),
          }
          : undefined,
    },
    select: { id: true },
  });

  await createActivityLog({
    taskId: updatedTask.id,
    userId: user.id,
    action: "UPDATED_DETAILS",
    field: Object.keys(patch).join(", "),
  });

  actionLogger("update_task_success", { taskId: updatedTask.id, userId: user.id });
  revalidatePath("/");
  return updatedTask;
}

export async function updateTaskStatus(input: UpdateTaskStatusInput) {
  const user = await getCurrentUser();
  const status = parseOrThrow(taskStatusSchema, input.status);
  const task = await getTaskOrThrow(input.taskId);

  if (user.role === Role.MEMBER) {
    await assertMemberOwnsTask(user.id, task);
  }

  actionLogger("update_task_status_start", { taskId: task.id, userId: user.id, status });

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: { status },
    select: { id: true, status: true, title: true, assigneeId: true },
  });

  await createActivityLog({
    taskId: task.id,
    userId: user.id,
    action: "UPDATED_STATUS",
    field: "status",
    oldValue: task.status,
    newValue: status,
  });

  if (updatedTask.assigneeId) {
    await createNotification(updatedTask.assigneeId, "TASK_STATUS_CHANGED", {
      taskId: task.id,
      taskTitle: updatedTask.title,
      actorId: user.id,
      actorName: (user.name || user.email || undefined) as string | undefined,
      message: `Changed status of "${updatedTask.title}" to ${status}`,
    });
  }

  actionLogger("update_task_status_success", { taskId: updatedTask.id, status: updatedTask.status, userId: user.id });
  revalidatePath("/");
  return updatedTask;
}

export async function reassignTask(input: ReassignTaskInput) {
  await requireAdmin();
  const user = await getCurrentUser();
  const task = await getTaskOrThrow(input.taskId);
  const assigneeId = parseOrThrow(createTaskSchema.shape.assigneeId, input.assigneeId);

  if (assigneeId) {
    await assertAssigneeIsMember(assigneeId);
  }

  actionLogger("reassign_task_start", { taskId: task.id, newAssigneeId: assigneeId });

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: { assigneeId },
    select: { id: true, assigneeId: true, title: true },
  });

  await createActivityLog({
    taskId: task.id,
    userId: user.id,
    action: "REASSIGNED",
    field: "assigneeId",
    oldValue: task.assigneeId || undefined,
    newValue: assigneeId || undefined,
  });

  if (assigneeId) {
    await createNotification(assigneeId, "TASK_ASSIGNED", {
      taskId: task.id,
      taskTitle: updatedTask.title,
      actorId: user.id,
      actorName: (user.name || user.email || undefined) as string | undefined,
      message: `Reassigned task "${updatedTask.title}" to you`,
    });
  }

  actionLogger("reassign_task_success", { taskId: updatedTask.id, newAssigneeId: updatedTask.assigneeId });
  revalidatePath("/");
  return updatedTask;
}

export async function deleteTask(taskId: unknown) {
  await requireAdmin();
  const task = await getTaskOrThrow(taskId);

  actionLogger("delete_task_start", { taskId: task.id });

  await prisma.task.delete({ where: { id: task.id } });
  actionLogger("delete_task_success", { taskId: task.id });
  revalidatePath("/");
}
