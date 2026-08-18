"use server";

import { Role } from "../../generated/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "../../../auth";
import { prisma } from "@/lib/prisma";
import {
  createTaskSchema,
  CreateTaskInput,
  taskIdSchema,
  taskStatusSchema,
  UpdateTaskStatusInput,
  ReassignTaskInput,
} from "@/lib/taskSchema";

class TaskActionError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = "TaskActionError";
  }
}

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new TaskActionError(400, result.error.issues[0]?.message ?? "Invalid input");
  }

  return result.data;
}

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new TaskActionError(401, "Unauthorized");
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER) {
    throw new TaskActionError(403, "Forbidden");
  }

  return session.user;
}

async function requireAdmin() {
  const user = await getCurrentUser();

  if (user.role !== Role.ADMIN) {
    throw new TaskActionError(403, "Only administrators can perform this action");
  }

  return user;
}

async function getTaskOrThrow(taskId: unknown) {
  const id = parseOrThrow(taskIdSchema, taskId);
  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true, assigneeId: true },
  });

  if (!task) {
    throw new TaskActionError(404, "Task not found");
  }

  return task;
}

async function assertMemberOwnsTask(userId: string, task: { assigneeId: string | null }) {
  if (task.assigneeId !== userId) {
    throw new TaskActionError(403, "Members can only update tasks assigned to them");
  }
}

async function assertAssigneeIsMember(assigneeId: string) {
  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { role: true },
  });

  if (!assignee || assignee.role !== Role.MEMBER) {
    throw new TaskActionError(400, "Tasks can only be assigned to members");
  }
}

export async function createTask(input: CreateTaskInput) {
  const user = await requireAdmin();
  const { title, description, assigneeId } = parseOrThrow(createTaskSchema, input);

  if (assigneeId) {
    await assertAssigneeIsMember(assigneeId);
  }

  const task = await prisma.task.create({
    data: { title, description, assigneeId, createdById: user.id },
    select: { id: true },
  });

  revalidatePath("/");
  return task;
}

export async function updateTaskStatus(input: UpdateTaskStatusInput) {
  const user = await getCurrentUser();
  const status = parseOrThrow(taskStatusSchema, input.status);
  const task = await getTaskOrThrow(input.taskId);

  if (user.role === Role.MEMBER) {
    await assertMemberOwnsTask(user.id, task);
  }

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: { status },
    select: { id: true, status: true },
  });

  revalidatePath("/");
  return updatedTask;
}

export async function reassignTask(input: ReassignTaskInput) {
  await requireAdmin();
  const task = await getTaskOrThrow(input.taskId);
  const assigneeId = parseOrThrow(createTaskSchema.shape.assigneeId, input.assigneeId);

  if (assigneeId) {
    await assertAssigneeIsMember(assigneeId);
  }

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: { assigneeId },
    select: { id: true, assigneeId: true },
  });

  revalidatePath("/");
  return updatedTask;
}

export async function deleteTask(taskId: unknown) {
  await requireAdmin();
  const task = await getTaskOrThrow(taskId);

  await prisma.task.delete({ where: { id: task.id } });
  revalidatePath("/");
}
