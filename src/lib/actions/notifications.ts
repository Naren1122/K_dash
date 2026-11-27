"use server";

import { prisma } from "@/lib/utils/prisma";
import type { NotificationType } from "@/lib/types/prisma_type";

import { getCurrentUser, ActionError } from "@/lib/utils/action-utils";
import { getAdminUsers } from "@/lib/data/user.data";
import type { NotificationPayload } from "@/lib/types/types";
import {
  trimUserNotificationsInDb,
  createNotificationInDb,
  findUserNotificationsInDb,
  markNotificationAsReadInDb,
  markAllNotificationsAsReadInDb,
  findDueSoonTasksInDb,
  findExistingNotificationInDb,
} from "@/lib/data/notification.data";

export async function trimUserNotifications(userId: string) {
  try {
    await trimUserNotificationsInDb(userId);
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
    return await createNotificationInDb(userId, type, payload);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function getUserNotifications(userId: string) {
  return findUserNotificationsInDb(userId);
}

export async function checkAndCreateDueSoonNotifications(userId: string) {
  try {
    const dueSoonTasks = await findDueSoonTasksInDb();
    if (dueSoonTasks.length === 0) return;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    for (const task of dueSoonTasks) {
      if (!task.dueDate) continue;

      const existing = await findExistingNotificationInDb(userId, "TASK_DUE_SOON", task.id, oneDayAgo);
      if (existing) continue;

      const diffMs = task.dueDate.getTime() - now.getTime();
      const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));

      let message = "";
      if (hoursLeft <= 0) {
        message = `Deadline alert: "${task.title}" is due today!`;
      } else if (hoursLeft <= 24) {
        message = `Deadline alert: "${task.title}" is due in ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"} (less than 24h left)!`;
      } else {
        message = `Deadline alert: "${task.title}" is due tomorrow!`;
      }

      await createNotification(
        userId,
        "TASK_DUE_SOON",
        {
          taskId: task.id,
          taskTitle: task.title,
          message,
        }
      );
    }
  } catch (error) {
    console.error("Failed to check and create due-soon notifications:", error);
  }
}

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
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}

export async function markNotificationAsRead(id: string, userId: string) {
  return markNotificationAsReadInDb(id, userId);
}

export async function markAllNotificationsAsRead(userId: string) {
  return markAllNotificationsAsReadInDb(userId);
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

export async function getNotificationsAction() {
  try {
    const user = await getCurrentUser();

    // Auto-trim to ensure older notifications beyond 10 are cleaned up
    await trimUserNotifications(user.id);

    const notifications = await getUserNotifications(user.id);
    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return { notifications, unreadCount };
  } catch {
    // If unauthenticated or session transition, return empty state safely
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markReadAction(notificationId: string) {
  if (!notificationId || typeof notificationId !== "string") {
    throw new ActionError(400, "Notification ID is required");
  }
  const user = await getCurrentUser();
  const result = await markNotificationAsRead(notificationId, user.id);
  if (result.count === 0) {
    throw new ActionError(404, "Notification not found or already read");
  }
  return { success: true };
}

export async function markAllReadAction() {
  const user = await getCurrentUser();
  await markAllNotificationsAsRead(user.id);
  return { success: true };
}

export async function deleteNotificationAction(notificationId: string) {
  if (!notificationId || typeof notificationId !== "string") {
    throw new ActionError(400, "Notification ID is required");
  }
  const user = await getCurrentUser();
  const result = await deleteNotification(notificationId, user.id);
  if (result.count === 0) {
    throw new ActionError(404, "Notification not found or already deleted");
  }
  return { success: true };
}

export async function deleteAllNotificationsAction() {
  const user = await getCurrentUser();
  await deleteAllNotifications(user.id);
  return { success: true };
}
