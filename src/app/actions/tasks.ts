"use server";

import { Role, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "../../../auth";
import { prisma } from "@/lib/prisma";

type CreateTaskInput = {
  title: unknown;
  description?: unknown;
  assigneeId?: unknown;
};

type UpdateTaskStatusInput = {
  taskId: unknown;
  status: unknown;
};

type ReassignTaskInput = {
  taskId: unknown;
  assigneeId: unknown;
};

class TaskActionError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = "TaskActionError";
  }
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

function requiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TaskActionError(400, `${fieldName} is required`);
  }

  return value.trim();
}

function optionalString(value: unknown, fieldName: string, maxLength: number) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new TaskActionError(400, `${fieldName} must be text`);
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new TaskActionError(400, `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return normalized || null;
}

function parseStatus(value: unknown) {
  if (typeof value !== "string" || !Object.values(TaskStatus).includes(value as TaskStatus)) {
    throw new TaskActionError(400, "Invalid task status");
  }

  return value as TaskStatus;
}

async function getTaskOrThrow(taskId: unknown) {
  const id = requiredString(taskId, "Task id");
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
  const title = requiredString(input.title, "Title");

  if (title.length > 200) {
    throw new TaskActionError(400, "Title must be 200 characters or fewer");
  }

  const description = optionalString(input.description, "Description", 2_000);
  const assigneeId = optionalString(input.assigneeId, "Assignee id", 100);

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
  const status = parseStatus(input.status);
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
  const assigneeId = optionalString(input.assigneeId, "Assignee id", 100);

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
