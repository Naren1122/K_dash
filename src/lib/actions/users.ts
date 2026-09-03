"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/utils/prisma";
import type { Role, Prisma } from "@/lib/types/prisma_type";
import { createUserSchema, CreateUserInput } from "@/lib/schemas/usersSchema";
import { logger } from "@/lib/utils/logger";
import {
  ActionError,
  parseOrThrow,
  requireAdmin,
} from "@/lib/utils/action-utils";

const actionLogger = (name: string, context?: Record<string, unknown>) => logger.action(name, context);

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, name: true },
  });
}

export async function countAdminUsers() {
  return prisma.user.count({
    where: { role: "ADMIN" },
  });
}

export async function getAdminUsers() {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
  });
}

export async function getAssignees() {
  return prisma.user.findMany({
    where: {
      role: "MEMBER",
      emailVerified: { not: null },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true, emailVerified: true },
  });
}

export async function createUserInDb(data: {
  name?: string | null;
  email: string;
  passwordHash: string;
  role: Role;
}) {
  return prisma.user.create({
    data: {
      name: data.name || null,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function deleteUserInDb(userId: string, fallbackCreatorId: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Reassign tasks created by this user to the admin performing deletion
    await tx.task.updateMany({
      where: { createdById: userId },
      data: { createdById: fallbackCreatorId },
    });

    // Unassign tasks assigned to this user
    await tx.task.updateMany({
      where: { assigneeId: userId },
      data: { assigneeId: null },
    });

    // Delete the user record (cascades to comments, notifications, activity logs)
    return tx.user.delete({
      where: { id: userId },
    });
  });
}

export async function createUser(input: CreateUserInput) {
  const admin = await requireAdmin();
  const { name, email, password, role } = parseOrThrow(createUserSchema, input);

  actionLogger("create_user_start", { adminId: admin.id, email, role });

  // Enforce single admin rule
  if (role === "ADMIN") {
    const adminCount = await countAdminUsers();
    if (adminCount >= 1) {
      actionLogger("create_user_admin_limit_reached", { adminCount });
      throw new ActionError(400, "There can only be 1 administrator in the system");
    }
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    actionLogger("create_user_conflict", { email });
    throw new ActionError(409, "A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await createUserInDb({
    name: name?.trim() || null,
    email,
    passwordHash,
    role,
  });

  actionLogger("create_user_success", {
    createdUserId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return {
    ...newUser,
    createdAt: newUser.createdAt.toISOString(),
  };
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) {
    actionLogger("delete_user_self_attempt", { adminId: admin.id });
    throw new ActionError(400, "You cannot delete your own admin account");
  }

  const target = await findUserById(userId);
  if (!target) {
    actionLogger("delete_user_not_found", { userId });
    throw new ActionError(404, "User not found");
  }

  if (target.role === "ADMIN") {
    actionLogger("delete_user_admin_attempt", { userId });
    throw new ActionError(403, "Administrator accounts cannot be deleted");
  }

  actionLogger("delete_user_start", { adminId: admin.id, userId, targetEmail: target.email });

  await deleteUserInDb(userId, admin.id);

  actionLogger("delete_user_success", { userId });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}
