"use client";

import { useEffect, useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  getNotificationsAction,
  markReadAction,
  markAllReadAction,
  deleteNotificationAction,
} from "@/actions/notifications";

type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: Date | string | null;
  createdAt: Date | string;
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout | null = null;

    async function load() {
      try {
        const data = await getNotificationsAction();
        if (!cancelled) {
          setNotifications(data.notifications as NotificationItem[]);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    function startPolling() {
      if (!interval) {
        interval = setInterval(() => {
          if (document.visibilityState === "visible") {
            load();
          }
        }, 15000);
      }
    }

    function stopPolling() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        load();
        startPolling();
      } else {
        stopPolling();
      }
    }

    load();
    startPolling();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", load);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", load);
    };
  }, []);


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markReadAction(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function handleMarkAllRead() {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await markAllReadAction();
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  }

  async function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    const wasUnread = target && !target.readAt;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await deleteNotificationAction(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-700 dark:hover:text-white cursor-pointer"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-80 z-50 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🔔</span> Notifications
            </h3>
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
            {loading ? (
              <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">No notifications</p>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                const timeStr = new Date(n.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={n.id}
                    onClick={() => isUnread && handleMarkRead(n.id)}
                    className={`group relative flex items-start justify-between rounded-xl p-2.5 transition-colors cursor-pointer ${
                      isUnread
                        ? "bg-indigo-50/70 border border-indigo-200/80 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:hover:bg-indigo-950/60"
                        : "border border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {String(n.payload?.message || n.payload?.taskTitle || "Notification")}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">{timeStr}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {isUnread ? (
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(n.id, e)}
                        title="Delete notification"
                        aria-label="Delete notification"
                        className="opacity-60 hover:opacity-100 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition p-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
