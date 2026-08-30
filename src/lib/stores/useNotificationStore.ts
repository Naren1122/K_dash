import { create } from "zustand";
import { getNotificationsAction } from "@/lib/actions/notifications";
import { playNotificationSound } from "@/lib/utils/sound";

export type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: Date | string | null;
  createdAt: Date | string;
};

const SOUND_STORAGE_KEY = "kanban_notification_sound";

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  isFirstLoad: boolean;
  lastKnownId: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  setNotifications: (notifications: NotificationItem[]) => void;
  markAsReadOptimistic: (id: string) => void;
  markAllAsReadOptimistic: () => void;
  deleteNotificationOptimistic: (id: string) => void;
  addNotificationOptimistic: (notification: NotificationItem) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,
  isFirstLoad: true,
  lastKnownId: null,

  fetchNotifications: async () => {
    try {
      const data = await getNotificationsAction();
      const newNotifications = (data?.notifications || []) as NotificationItem[];
      const newUnreadCount = data?.unreadCount ?? 0;
      const newestNotif = newNotifications[0];
      const { isFirstLoad, lastKnownId } = get();

      // Trigger audio notification chime on newly arrived unread notifications
      if (
        !isFirstLoad &&
        newestNotif &&
        newestNotif.id !== lastKnownId &&
        !newestNotif.readAt
      ) {
        if (typeof window !== "undefined") {
          const savedSound = localStorage.getItem(SOUND_STORAGE_KEY);
          const isAudioOn = savedSound === null ? true : savedSound === "true";
          if (isAudioOn) {
            playNotificationSound();
          }
        }
      }

      set({
        notifications: newNotifications,
        unreadCount: newUnreadCount,
        loading: false,
        isFirstLoad: false,
        lastKnownId: newestNotif ? newestNotif.id : lastKnownId,
      });
    } catch (err) {
      console.debug("Failed to fetch notifications:", err);
      set({ loading: false });
    }
  },

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.readAt).length;
    set({ notifications, unreadCount });
  },

  markAsReadOptimistic: (id: string) => {
    const current = get().notifications;
    const updated = current.map((n) =>
      n.id === id ? { ...n, readAt: new Date() } : n
    );
    const unreadCount = updated.filter((n) => !n.readAt).length;
    set({ notifications: updated, unreadCount });
  },

  markAllAsReadOptimistic: () => {
    const current = get().notifications;
    const updated = current.map((n) => ({ ...n, readAt: new Date() }));
    set({ notifications: updated, unreadCount: 0 });
  },

  deleteNotificationOptimistic: (id: string) => {
    const current = get().notifications;
    const updated = current.filter((n) => n.id !== id);
    const unreadCount = updated.filter((n) => !n.readAt).length;
    set({ notifications: updated, unreadCount });
  },

  addNotificationOptimistic: (notification: NotificationItem) => {
    const current = get().notifications;
    const updated = [notification, ...current.filter((n) => n.id !== notification.id)];
    const unreadCount = updated.filter((n) => !n.readAt).length;
    set({
      notifications: updated,
      unreadCount,
      lastKnownId: notification.id,
    });
  },
}));
