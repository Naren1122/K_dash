"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/utils/prisma";
import type { Prisma } from "@/lib/types/prisma_type";
import {
  inviteUserSchema,
  InviteUserInput,
  acceptInviteSchema,
  AcceptInviteInput,
} from "@/lib/schemas/invitationSchema";
import { logger } from "@/lib/utils/logger";
import {
  ActionError,
  parseOrThrow,
  requireAdmin,
} from "@/lib/utils/action-utils";
import { sendInvitationEmail } from "@/lib/utils/email";

const actionLogger = (name: string, context?: Record<string, unknown>) =>
  logger.action(name, context);

const INVITATION_EXPIRY_MINUTES = 15;

function getBaseAppUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

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

export async function getInvitationByToken(token: string) {
  if (!token || typeof token !== "string") {
    return { success: false, error: "Invalid token provided" };
  }

  const invitation = await findInvitationByTokenInDb(token);

  if (!invitation) {
    return { success: false, error: "Invitation not found or invalid link" };
  }

  if (invitation.status === "ACCEPTED") {
    return {
      success: false,
      error: "This invitation has already been accepted.",
      alreadyAccepted: true,
    };
  }

  if (invitation.status === "REVOKED") {
    return {
      success: false,
      error: "This invitation has been revoked by an administrator.",
    };
  }

  if (new Date() > invitation.expiresAt) {
    return {
      success: false,
      error: "This invitation link has expired (15-minute limit exceeded). Please request a new invite.",
      isExpired: true,
    };
  }

  // Get user details associated with this email
  const user = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { name: true, email: true },
  });

  return {
    success: true,
    data: {
      id: invitation.id,
      email: invitation.email,
      name: user?.name || null,
      role: invitation.role,
      inviterName: invitation.inviter.name || invitation.inviter.email,
      task: invitation.task
        ? {
            id: invitation.task.id,
            title: invitation.task.title,
            description: invitation.task.description,
            priority: invitation.task.priority,
            dueDate: invitation.task.dueDate
              ? invitation.task.dueDate.toISOString()
              : null,
          }
        : null,
    },
  };
}

export async function createAndSendInvitation({
  email,
  name,
  role = "MEMBER",
  taskId,
  inviterId,
  tx,
}: {
  email: string;
  name?: string | null;
  role?: "ADMIN" | "MEMBER";
  taskId?: string | null;
  inviterId: string;
  tx?: Prisma.TransactionClient;
}) {
  const db = tx || prisma;
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MINUTES * 60 * 1000);

  // Check if user already exists
  let user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Generate a temporary random password hash
    const randomSecret = crypto.randomBytes(24).toString("hex");
    const temporaryHash = await bcrypt.hash(randomSecret, 12);

    user = await db.user.create({
      data: {
        email,
        name: name?.trim() || null,
        passwordHash: temporaryHash,
        role,
        emailVerified: null,
      },
    });
  } else if (name && !user.name) {
    // Update name if previously blank
    await db.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });
  }

  // Revoke any previous pending invitations for this email
  await db.invitation.updateMany({
    where: { email, status: "PENDING" },
    data: { status: "REVOKED" },
  });

  // Create new invitation record
  const invitation = await db.invitation.create({
    data: {
      email,
      token,
      role,
      expiresAt,
      inviterId,
      taskId: taskId || null,
      status: "PENDING",
    },
    include: {
      inviter: { select: { name: true, email: true } },
      task: { select: { title: true, priority: true, dueDate: true } },
    },
  });

  const inviteUrl = `${getBaseAppUrl()}/invite/accept?token=${token}`;

  // Send the email asynchronously (don't block UI if SMTP is slow)
  sendInvitationEmail({
    toEmail: email,
    inviteeName: name || user.name,
    inviterName: invitation.inviter.name || invitation.inviter.email,
    inviteUrl,
    taskTitle: invitation.task?.title || null,
    taskPriority: invitation.task?.priority || null,
    taskDueDate: invitation.task?.dueDate
      ? invitation.task.dueDate.toLocaleDateString()
      : null,
  }).catch((err) => {
    logger.error("Failed to send invitation email in background", { error: err });
  });

  return { invitation, user, token, inviteUrl };
}

export async function inviteUser(input: InviteUserInput) {
  const admin = await requireAdmin();
  const { email, name, role } = parseOrThrow(inviteUserSchema, input);

  actionLogger("invite_user_start", { adminId: admin.id, email, role });

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing && existing.emailVerified) {
    actionLogger("invite_user_already_registered", { email });
    throw new ActionError(
      409,
      "A registered and active user with this email already exists"
    );
  }

  const result = await createAndSendInvitation({
    email,
    name,
    role,
    inviterId: admin.id,
  });

  actionLogger("invite_user_success", {
    email,
    invitationId: result.invitation.id,
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return {
    success: true as const,
    data: {
      invitationId: result.invitation.id,
      email: result.invitation.email,
    },
  };
}

export async function acceptInvitation(input: AcceptInviteInput) {
  const { token, name, password } = parseOrThrow(acceptInviteSchema, input);

  actionLogger("accept_invitation_start", { token: token.slice(0, 8) + "..." });

  const invitation = await findInvitationByTokenInDb(token);

  if (!invitation) {
    throw new ActionError(404, "Invitation not found or link is invalid");
  }

  if (invitation.status === "ACCEPTED") {
    throw new ActionError(400, "This invitation has already been accepted");
  }

  if (invitation.status === "REVOKED") {
    throw new ActionError(403, "This invitation has been revoked");
  }

  if (new Date() > invitation.expiresAt) {
    throw new ActionError(400, "This invitation link has expired");
  }

  const newPasswordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Update the user record
    await tx.user.update({
      where: { email: invitation.email },
      data: {
        name: name.trim(),
        passwordHash: newPasswordHash,
        emailVerified: new Date(),
        role: invitation.role,
      },
    });

    // 2. Mark invitation as accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
  });

  actionLogger("accept_invitation_success", {
    email: invitation.email,
    invitationId: invitation.id,
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return {
    success: true,
    email: invitation.email,
    taskId: invitation.taskId,
  };
}
