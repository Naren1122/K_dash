import { prisma } from "@/lib/utils/prisma";
import type { NotificationType } from "@/lib/types/prisma_type";
import type { NotificationPayload } from "@/lib/types/types";

export const MAX_NOTIFICATIONS_PER_USER = 10;

export async function trimUserNotificationsInDb(userId: string) {
  const recent = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_NOTIFICATIONS_PER_USER,
    select: { id: true },
  });

  if (recent.length === MAX_NOTIFICATIONS_PER_USER) {
    const keepIds = recent.map((r) => r.id);
    await prisma.notification.deleteMany({
      where: {
        userId,
        id: { notIn: keepIds },
      },
    });
  }
}

export async function createNotificationInDb(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload
) {
  const created = await prisma.notification.create({
    data: {
      userId,
      type,
      payload: payload as object,
    },
  });

  await trimUserNotificationsInDb(userId).catch(() => {});
  return created;
}

export async function findUserNotificationsInDb(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_NOTIFICATIONS_PER_USER,
    select: {
      id: true,
      type: true,
      payload: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function countUnreadNotificationsInDb(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}

export async function markNotificationAsReadInDb(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsAsReadInDb(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function findDueSoonTasksInDb() {
  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      dueDate: {
        gte: oneDayAgo,
        lte: oneDayLater,
      },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      assigneeId: true,
    },
  });
}

export async function findExistingNotificationInDb(userId: string, type: NotificationType, taskId: string, sinceDate: Date) {
  return prisma.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: sinceDate },
      payload: {
        path: ["taskId"],
        equals: taskId,
      },
    },
  });
}
