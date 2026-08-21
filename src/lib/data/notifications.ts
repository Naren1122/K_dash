import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { getAdminUsers } from "@/lib/data/users";

export type { NotificationType };

export type NotificationPayload = {
  taskId?: string;
  taskTitle?: string;
  actorId?: string;
  actorName?: string;
  message?: string;
};

const MAX_NOTIFICATIONS_PER_USER = 10;

/**
 * Automatically trims notifications for a user so they never exceed the max limit (10).
 * Deletes the oldest notifications beyond the 10 most recent.
 */
export async function trimUserNotifications(userId: string) {
  try {
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
  } catch (error) {
    console.error("Failed to trim notifications:", error);
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload
) {
  try {
    const created = await prisma.notification.create({
      data: {
        userId,
        type,
        payload: payload as object,
      },
    });

    await trimUserNotifications(userId);
    return created;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function getUserNotifications(userId: string) {
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

/**
 * Checks for upcoming task deadlines (within 24 hours) and creates
 * TASK_DUE_SOON notifications for BOTH admin and member roles.
 */
export async function checkAndCreateDueSoonNotifications(userId: string) {
  try {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find all active tasks due within the next 24 hours
    const dueSoonTasks = await prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        dueDate: {
          gte: now,
          lte: oneDayLater,
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
      },
    });

    if (dueSoonTasks.length === 0) return;

    // Check existing TASK_DUE_SOON notifications for this user in the last 24h
    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId,
        type: "TASK_DUE_SOON",
        createdAt: { gte: oneDayAgo },
      },
      select: {
        payload: true,
      },
    });

    const notifiedTaskIds = new Set<string>();
    for (const notif of existingNotifications) {
      const payload = notif.payload as NotificationPayload | null;
      if (payload?.taskId) {
        notifiedTaskIds.add(payload.taskId);
      }
    }

    for (const task of dueSoonTasks) {
      if (!task.dueDate || notifiedTaskIds.has(task.id)) continue;

      const hoursLeft = Math.max(
        1,
        Math.round((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      );

      await createNotification(
        userId,
        "TASK_DUE_SOON",
        {
          taskId: task.id,
          taskTitle: task.title,
          message: `Deadline alert: "${task.title}" is due in ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"}!`,
        }
      );
    }
  } catch (error) {
    console.error("Failed to check and create due-soon notifications:", error);
  }
}

/**
 * Notifies ALL users (both Admin and Member, as well as the actor role itself)
 * for every task change made on the board.
 */
export async function notifyTaskStakeholders(
  _taskId: string,
  type: NotificationType,
  payload: NotificationPayload
) {
  try {
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });

    const recipientIds = allUsers.map((u) => u.id);
    if (recipientIds.length === 0) return;

    const notificationsToCreate = recipientIds.map((userId) => ({
      userId,
      type,
      payload: payload as object,
    }));

    await prisma.notification.createMany({
      data: notificationsToCreate,
    });

    // Auto-trim notifications for each recipient to keep max 10
    await Promise.all(recipientIds.map((id) => trimUserNotifications(id)));
  } catch (error) {
    console.error("Failed to notify task stakeholders:", error);
  }
}

export async function notifyAllAdmins(
  type: NotificationType,
  payload: NotificationPayload
) {
  try {
    const admins = await getAdminUsers();

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type,
          payload: payload as object,
        })),
      });

      await Promise.all(admins.map((a) => trimUserNotifications(a.id)));
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
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
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
