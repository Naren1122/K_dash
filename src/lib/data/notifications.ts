import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export type { NotificationType };

export type NotificationPayload = {
  taskId?: string;
  taskTitle?: string;
  actorId?: string;
  actorName?: string;
  message?: string;
};

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload,
  allowSelfNotify = false
) {
  if (!allowSelfNotify && payload.actorId && payload.actorId === userId) {
    return;
  }

  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        payload: payload as object,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function notifyTaskStakeholders(
  taskId: string,
  type: NotificationType,
  payload: NotificationPayload,
  additionalRecipientIds: (string | null | undefined)[] = []
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, createdById: true },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const adminIds = new Set(admins.map((a: { id: string }) => a.id));
    const recipientIds = new Set<string>();

    if (task?.assigneeId) recipientIds.add(task.assigneeId);
    if (task?.createdById) recipientIds.add(task.createdById);
    for (const admin of admins) {
      recipientIds.add(admin.id);
    }
    for (const id of additionalRecipientIds) {
      if (id) recipientIds.add(id);
    }

    for (const recipientId of recipientIds) {
      if (!recipientId) continue;
      const isAdmin = adminIds.has(recipientId);
      const isSelf = recipientId === payload.actorId;

      // Admins receive notifications for ALL events (made by members or by admin themself)
      // Non-admin members receive notifications for other users' actions on their tasks
      if (isAdmin || !isSelf) {
        await createNotification(recipientId, type, payload, isAdmin);
      }
    }
  } catch (error) {
    console.error("Failed to notify task stakeholders:", error);
  }
}

export async function notifyAllAdmins(
  type: NotificationType,
  payload: NotificationPayload
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification(admin.id, type, payload, true);
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}

export async function markNotificationAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.deleteMany({
    where: { userId },
  });
}

export async function deleteNotification(id: string, userId: string) {
  return prisma.notification.deleteMany({
    where: { id, userId },
  });
}

export async function deleteAllNotifications(userId: string) {
  return prisma.notification.deleteMany({
    where: { userId },
  });
}
