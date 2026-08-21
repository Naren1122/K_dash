"use server";

import { getCurrentUser } from "@/utils/action-utils";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "@/lib/data/notifications";

export async function getNotificationsAction() {
  const user = await getCurrentUser();
  const notifications = await getUserNotifications(user.id);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return { notifications, unreadCount };
}

export async function markReadAction(notificationId: string) {
  const user = await getCurrentUser();
  await markNotificationAsRead(notificationId, user.id);
  return { success: true };
}

export async function markAllReadAction() {
  const user = await getCurrentUser();
  await markAllNotificationsAsRead(user.id);
  return { success: true };
}

export async function deleteNotificationAction(notificationId: string) {
  const user = await getCurrentUser();
  await deleteNotification(notificationId, user.id);
  return { success: true };
}

export async function deleteAllNotificationsAction() {
  const user = await getCurrentUser();
  await deleteAllNotifications(user.id);
  return { success: true };
}

