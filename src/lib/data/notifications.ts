import { prisma } from "@/lib/types/prisma";
import type { NotificationType } from "@/generated/prisma/client";

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
  payload: NotificationPayload
) {
  if (payload.actorId && payload.actorId === userId) {
    return;
  }

  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        payload: payload as any,
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

export async function markNotificationAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
