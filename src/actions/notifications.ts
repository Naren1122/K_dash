"use server";

import { getCurrentUser } from "@/utils/action-utils";
import {
  getUserNotifications,
  checkAndCreateDueSoonNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "@/lib/data/notifications";

// In-memory throttle to run the heavy deadline check at most once every 3 minutes per user
const lastDueCheckMap = new Map<string, number>();
const DUE_CHECK_INTERVAL_MS = 3 * 60 * 1000;

export async function getNotificationsAction() {
  try {
    const user = await getCurrentUser();

    const now = Date.now();
    const lastCheck = lastDueCheckMap.get(user.id) || 0;
    if (now - lastCheck > DUE_CHECK_INTERVAL_MS) {
      lastDueCheckMap.set(user.id, now);
      await checkAndCreateDueSoonNotifications(user.id);
    }

    const notifications = await getUserNotifications(user.id);
    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return { notifications, unreadCount };
  } catch {
    // If unauthenticated or session transition, return empty state safely
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markReadAction(notificationId: string) {
  try {
    const user = await getCurrentUser();
    await markNotificationAsRead(notificationId, user.id);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markAllReadAction() {
  try {
    const user = await getCurrentUser();
    await markAllNotificationsAsRead(user.id);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    const user = await getCurrentUser();
    await deleteNotification(notificationId, user.id);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteAllNotificationsAction() {
  try {
    const user = await getCurrentUser();
    await deleteAllNotifications(user.id);
    return { success: true };
  } catch {
    return { success: false };
  }
}
