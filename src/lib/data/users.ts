import { prisma } from "@/lib/prisma";
import type { Role, Prisma } from "@/generated/prisma/client";

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
