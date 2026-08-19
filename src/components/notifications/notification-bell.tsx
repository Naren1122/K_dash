"use client";

import { useEffect, useState, useRef } from "react";
import {
  getNotificationsAction,
  markReadAction,
  markAllReadAction,
} from "@/app/actions/notifications";

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

    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
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
    await markReadAction(id);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
    setUnreadCount(0);
    await markAllReadAction();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
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
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-80 z-50 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 cursor-pointer"
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
                    className={`group flex items-start justify-between rounded-xl p-2.5 transition cursor-pointer ${
                      isUnread
                        ? "bg-sky-50/60 hover:bg-sky-50 dark:bg-sky-950/40 dark:hover:bg-sky-950/60"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {String(n.payload?.message || n.payload?.taskTitle || "Notification")}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{timeStr}</p>
                    </div>
                    {isUnread ? (
                      <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0 mt-1" />
                    ) : null}
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
