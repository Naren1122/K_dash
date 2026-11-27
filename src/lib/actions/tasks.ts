"use server";

import { z } from "zod";
import { Role } from "@/lib/types/prisma_type";
import { revalidatePath } from "next/cache";

import {
  createTaskSchema,
  CreateTaskInput,
  taskIdSchema,
  taskStatusSchema,
  updateTaskSchema,
  UpdateTaskStatusInput,
  ReassignTaskInput,
} from "@/lib/schemas/tasksSchema";
import { logger } from "@/lib/utils/logger";
import {
  ActionError,
  getCurrentUser,
  getTaskOrThrow,
  parseOrThrow,
  requireAdmin,
} from "@/lib/utils/action-utils";
import type { BoardTask } from "@/lib/types/types";

import { createActivityLog } from "@/lib/actions/activity";
import { notifyTaskStakeholders } from "@/lib/actions/notifications";
import { findUserById } from "@/lib/data/user.data";
import {
  findBoardTasksInDb,
  findTaskByIdInDb,
  createTaskInDb,
  updateTaskInDb,
  updateTaskStatusInDb,
  reassignTaskInDb,
  deleteTaskInDb,
} from "@/lib/data/task.data";

const actionLogger = (name: string, context?: Record<string, unknown>) => logger.action(name, context);

export async function getBoardTasks(
  userId: string,
  role: Role | "ADMIN" | "MEMBER"
): Promise<BoardTask[]> {
  return findBoardTasksInDb(userId, role);
}

export async function getTaskById(taskId: string): Promise<BoardTask | null> {
  return findTaskByIdInDb(taskId);
}

async function assertMemberOwnsTask(userId: string, task: { assigneeId: string | null }) {
  if (task.assigneeId !== userId) {
    actionLogger("ownership_check_failed", { userId, taskAssigneeId: task.assigneeId });
    throw new ActionError(403, "Members can only update tasks assigned to them");
  }
}

async function assertAssigneeIsMember(assigneeId: string) {
  const assignee = await findUserById(assigneeId);

  if (!assignee || assignee.role !== Role.MEMBER) {
    actionLogger("assignee_validation_failed", { assigneeId, role: assignee?.role });
    throw new ActionError(400, "Tasks can only be assigned to members");
  }

  if (!assignee.emailVerified) {
    actionLogger("assignee_not_verified", { assigneeId });
    throw new ActionError(400, "Tasks can only be assigned to members who have accepted their invitation");
  }
}

const updateTaskInputSchema = updateTaskSchema.extend({
  taskId: taskIdSchema,
  status: taskStatusSchema.optional(),
});

type UpdateTaskData = z.infer<typeof updateTaskInputSchema>;

export async function createTask(input: CreateTaskInput) {
  const user = await requireAdmin();
  const parsed = parseOrThrow(createTaskSchema, input);

  if (parsed.assigneeId) {
    await assertAssigneeIsMember(parsed.assigneeId);
  }

  actionLogger("create_task_start", {
    userId: user.id,
    title: parsed.title,
    assigneeId: parsed.assigneeId,
    priority: parsed.priority,
    dueDate: parsed.dueDate,
  });

  const task = await createTaskInDb(parsed, user.id);

  await createActivityLog({
    taskId: task.id,
    userId: user.id,
    action: "CREATED",
  });

  if (task.assignee) {
    await notifyTaskStakeholders(task.id, "TASK_ASSIGNED", {
      taskId: task.id,
      taskTitle: task.title,
      actorId: user.id,
      actorName: (user.name || user.email || undefined) as string | undefined,
      message: `${user.name || user.email || "Admin"} assigned task "${task.title}" to you`,
    });
  }

  actionLogger("create_task_success", { taskId: task.id });
  revalidatePath("/");
  return task;
}

export async function updateTask(input: UpdateTaskData) {
  const user = await getCurrentUser();
  const { taskId, labelIds, ...patchFields } = parseOrThrow(updateTaskInputSchema, input);

  const existingTask = await getTaskOrThrow(taskId);

  if (user.role === Role.MEMBER) {
    await assertMemberOwnsTask(user.id, existingTask);
  }

  if (patchFields.assigneeId) {
    await assertAssigneeIsMember(patchFields.assigneeId);
  }

  const updatedTask = await updateTaskInDb(taskId, {
    title: patchFields.title,
    description: patchFields.description,
    status: patchFields.status,
    priority: user.role === Role.ADMIN ? patchFields.priority : undefined,
    dueDate: patchFields.dueDate ? new Date(patchFields.dueDate) : patchFields.dueDate === null ? null : undefined,
    assigneeId: patchFields.assigneeId,
    labelIds,
  });

  // Log activity differences
  if (patchFields.title && patchFields.title !== existingTask.title) {
    await createActivityLog({
      taskId,
      userId: user.id,
      action: "UPDATED_TITLE",
      oldValue: existingTask.title,
      newValue: patchFields.title,
    });
  }

  if (patchFields.status && patchFields.status !== existingTask.status) {
    await createActivityLog({
      taskId,
      userId: user.id,
      action: "STATUS_CHANGED",
      oldValue: existingTask.status,
      newValue: patchFields.status,
    });

    await notifyTaskStakeholders(taskId, "TASK_STATUS_CHANGED", {
      taskId,
      taskTitle: updatedTask.title,
      actorId: user.id,
      actorName: (user.name || user.email || undefined) as string | undefined,
      message: `${user.name || user.email || "Someone"} changed status to ${patchFields.status}`,
    });
  }

  if (patchFields.assigneeId !== undefined && patchFields.assigneeId !== existingTask.assigneeId) {
    await createActivityLog({
      taskId,
      userId: user.id,
      action: "REASSIGNED",
      oldValue: existingTask.assigneeId ?? "unassigned",
      newValue: patchFields.assigneeId ?? "unassigned",
    });

    if (patchFields.assigneeId) {
      await notifyTaskStakeholders(taskId, "TASK_ASSIGNED", {
        taskId,
        taskTitle: updatedTask.title,
        actorId: user.id,
        actorName: (user.name || user.email || undefined) as string | undefined,
        message: `${user.name || user.email || "Admin"} assigned task "${updatedTask.title}" to you`,
      });
    }
  }

  actionLogger("update_task_success", { taskId });
  revalidatePath("/");
  return updatedTask;
}

export async function updateTaskStatus(input: UpdateTaskStatusInput) {
  const user = await getCurrentUser();
  const { taskId, status } = parseOrThrow(
    z.object({ taskId: taskIdSchema, status: taskStatusSchema }),
    input
  );

  const existingTask = await getTaskOrThrow(taskId);

  if (user.role === Role.MEMBER) {
    await assertMemberOwnsTask(user.id, existingTask);
  }

  if (existingTask.status === status) {
    return existingTask;
  }

  const updated = await updateTaskStatusInDb(taskId, status);

  await createActivityLog({
    taskId,
    userId: user.id,
    action: "STATUS_CHANGED",
    oldValue: existingTask.status,
    newValue: status,
  });

  await notifyTaskStakeholders(taskId, "TASK_STATUS_CHANGED", {
    taskId,
    taskTitle: updated.title,
    actorId: user.id,
    actorName: (user.name || user.email || undefined) as string | undefined,
    message: `${user.name || user.email || "Someone"} moved "${updated.title}" to ${status}`,
  });

  actionLogger("update_task_status_success", { taskId, oldStatus: existingTask.status, newStatus: status });
  revalidatePath("/");
  return updated;
}

export async function reassignTask(input: ReassignTaskInput) {
  const user = await requireAdmin();
  const { taskId, assigneeId } = parseOrThrow(
    z.object({ taskId: taskIdSchema, assigneeId: z.string().nullable() }),
    input
  );

  const existingTask = await getTaskOrThrow(taskId);

  if (assigneeId) {
    await assertAssigneeIsMember(assigneeId);
  }

  const updated = await reassignTaskInDb(taskId, assigneeId);

  await createActivityLog({
    taskId,
    userId: user.id,
    action: "REASSIGNED",
    oldValue: existingTask.assigneeId ?? "unassigned",
    newValue: assigneeId ?? "unassigned",
  });

  if (assigneeId) {
    await notifyTaskStakeholders(taskId, "TASK_ASSIGNED", {
      taskId,
      taskTitle: updated.title,
      actorId: user.id,
      actorName: (user.name || user.email || undefined) as string | undefined,
      message: `${user.name || user.email || "Admin"} assigned task "${updated.title}" to you`,
    });
  }

  actionLogger("reassign_task_success", { taskId, assigneeId });
  revalidatePath("/");
  return updated;
}

export async function deleteTask(taskIdInput: unknown) {
  const user = await requireAdmin();
  const taskId = parseOrThrow(taskIdSchema, taskIdInput);

  actionLogger("delete_task_start", { taskId, userId: user.id });

  await getTaskOrThrow(taskId);
  await deleteTaskInDb(taskId);

  actionLogger("delete_task_success", { taskId });
  revalidatePath("/");
  return { success: true };
}
