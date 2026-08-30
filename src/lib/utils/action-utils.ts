import "server-only";

import { z } from "zod";

import { auth } from "@/auth";
import { Role } from "@/lib/types/prisma_type";
import { prisma } from "@/lib/utils/prisma";
import { logger } from "@/lib/utils/logger";
import { taskIdSchema } from "@/lib/schemas/tasksSchema";
import {
  AppError,
  ErrorCode,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  formatZodErrorMessage,
} from "@/lib/errors";

export class ActionError extends AppError {
  public readonly status: 400 | 401 | 403 | 404 | 409;

  constructor(status: 400 | 401 | 403 | 404 | 409, message: string) {
    const code =
      status === 400
        ? ErrorCode.BAD_REQUEST
        : status === 401
          ? ErrorCode.UNAUTHORIZED
          : status === 403
            ? ErrorCode.FORBIDDEN
            : status === 404
              ? ErrorCode.NOT_FOUND
              : ErrorCode.CONFLICT;

    super(message, { statusCode: status, code });
    this.status = status;
    this.name = "ActionError";
  }
}

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    logger.action("validation_failed", { errors: result.error.issues });
    const message = formatZodErrorMessage(result.error);
    throw new ValidationError(message);
  }

  return result.data;
}

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id && !session?.user?.email) {
    logger.action("auth_failed", { reason: "no_session" });
    throw new UnauthorizedError();
  }

  // 1. Look up user by session ID
  let user = session.user.id
    ? await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true },
    })
    : null;

  // 2. Self-healing fallback: If not found by ID (e.g. database was reset or re-seeded), look up by email
  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  if (!user) {
    logger.action("auth_failed", {
      reason: "user_not_found_in_db",
      userId: session?.user?.id,
      email: session?.user?.email,
    });
    throw new UnauthorizedError(
      "Your session is associated with an account that no longer exists. Please sign in again."
    );
  }

  if (user.role !== Role.ADMIN && user.role !== Role.MEMBER) {
    logger.action("auth_failed", { reason: "invalid_role", role: user.role });
    throw new ForbiddenError();
  }

  logger.debug("auth_success", { userId: user.id, role: user.role });
  return user;
}



export async function requireAdmin() {
  const user = await getCurrentUser();

  if (user.role !== Role.ADMIN) {
    logger.action("admin_required", { userId: user.id, role: user.role });
    throw new ForbiddenError("Only administrators can perform this action");
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
    throw new NotFoundError("Task", id);
  }

  return task;
}