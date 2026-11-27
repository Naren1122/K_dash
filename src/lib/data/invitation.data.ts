import { prisma } from "@/lib/utils/prisma";
import type { Role, InvitationStatus } from "@/lib/types/prisma_type";

export async function findInvitationByTokenInDb(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      inviter: {
        select: { id: true, name: true, email: true },
      },
      task: {
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          dueDate: true,
        },
      },
    },
  });
}

export async function findInvitationByEmailInDb(email: string) {
  return prisma.invitation.findFirst({
    where: {
      email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
}

export async function createInvitationInDb(data: {
  email: string;
  token: string;
  role: Role;
  expiresAt: Date;
  inviterId: string;
  taskId?: string | null;
}) {
  return prisma.invitation.create({
    data: {
      email: data.email,
      token: data.token,
      role: data.role,
      expiresAt: data.expiresAt,
      inviterId: data.inviterId,
      taskId: data.taskId ?? null,
    },
  });
}

export async function updateInvitationStatusInDb(
  id: string,
  status: InvitationStatus,
  acceptedAt?: Date
) {
  return prisma.invitation.update({
    where: { id },
    data: {
      status,
      ...(acceptedAt ? { acceptedAt } : {}),
    },
  });
}

export async function findPendingInvitationsInDb() {
  return prisma.invitation.findMany({
    where: { status: "PENDING" },
    include: {
      inviter: { select: { name: true, email: true } },
      task: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
