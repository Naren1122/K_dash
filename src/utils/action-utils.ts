import "server-only";

import { z } from "zod";

import { auth } from "../../auth";
import { Role } from "@/types/prisma";
import { prisma } from "@/lib/prisma";
import { logger } from "@/utils/logger";
import { taskIdSchema } from "@/lib/schemas/tasksSchema";

export class ActionError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409,
    message: string,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    logger.action("validation_failed", { errors: result.error.issues });
    const messages = result.error.issues.map(issue => issue.message).join('; ');
    throw new ActionError(400, messages || "Invalid input");
  }

  return result.data;
}

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    logger.action("auth_failed", { reason: "no_session" });
    throw new ActionError(401, "Unauthorized");
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER) {
    logger.action("auth_failed", { reason: "invalid_role", role: session.user.role });
    throw new ActionError(403, "Forbidden");
  }

  logger.action("auth_success", { userId: session.user.id, role: session.user.role });
  return session.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (user.role !== Role.ADMIN) {
    logger.action("admin_required", { userId: user.id, role: user.role });
    throw new ActionError(403, "Only administrators can perform this action");
  }

  return user;
}

export async function getTaskOrThrow(taskId: unknown) {
  const id = parseOrThrow(taskIdSchema, taskId);
  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true, assigneeId: true, title: true, status: true, createdById: true },
  });

  if (!task) {
    logger.action("task_not_found", { taskId: id });
    throw new ActionError(404, "Task not found");
  }

  return task;
}