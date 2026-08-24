"use client";

import { useEffect, useState, useRef } from "react";
import { Trash2, Volume2, VolumeX, Clock, MessageSquare, CheckCircle2, UserCheck, Bell } from "lucide-react";
import {
  getNotificationsAction,
  markReadAction,
  markAllReadAction,
  deleteNotificationAction,
} from "@/actions/notifications";
import { playNotificationSound } from "@/utils/sound";
import { useActionRunner } from "@/hooks/useActionRunner";

type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: Date | string | null;
  createdAt: Date | string;
};

const SOUND_STORAGE_KEY = "kanban_notification_sound";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    return saved !== null ? saved === "true" : true;
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);
  const lastKnownIdRef = useRef<string | null>(null);
  const { run } = useActionRunner();

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      if (next) {
        playNotificationSound();
      }
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout | null = null;

    async function load() {
      try {
        const data = await getNotificationsAction();
        if (!cancelled) {
          const newNotifications = data.notifications as NotificationItem[];
          const newUnreadCount = data.unreadCount;
          const newestNotif = newNotifications[0];

          // If new notifications arrived after initial load, play sound chime without toaster popup
          if (
            !isFirstLoadRef.current &&
            newestNotif &&
            newestNotif.id !== lastKnownIdRef.current &&
            !newestNotif.readAt
          ) {
            const savedSound = localStorage.getItem(SOUND_STORAGE_KEY);
            const isAudioOn = savedSound === null ? true : savedSound === "true";
            if (isAudioOn) {
              playNotificationSound();
            }
          }

          if (newestNotif) {
            lastKnownIdRef.current = newestNotif.id;
          }

          setNotifications(newNotifications);
          setUnreadCount(newUnreadCount);
          isFirstLoadRef.current = false;
        }
      } catch (err) {
        console.debug("Notifications polling offline/reconnecting:", err);
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
        }, 5000); // Check every 5 seconds for fast live updates
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

  function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    run(() => markReadAction(id));
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
    setUnreadCount(0);
    run(() => markAllReadAction(), {
      successMessage: "All notifications marked as read",
    });
  }

  function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    const wasUnread = target && !target.readAt;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    run(() => deleteNotificationAction(id));
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "TASK_DUE_SOON":
        return <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      case "TASK_ASSIGNED":
        return <UserCheck className="h-3.5 w-3.5 text-sky-500 shrink-0" />;
      case "TASK_STATUS_CHANGED":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      case "TASK_COMMENTED":
        return <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
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
        <Bell className="h-4 w-4" />

        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-84 z-50 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-slate-700 dark:text-slate-200" />
                <span>Notifications</span>
              </h3>
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
                className="flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer p-0.5 rounded"
              >
                {soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5 text-sky-500" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
            </div>
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

          <div className="mt-2 max-h-80 space-y-1.5 overflow-y-auto">
            {loading ? (
              <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">No notifications</p>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                const isDueSoon = n.type === "TASK_DUE_SOON";
                const timeStr = new Date(n.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={n.id}
                    onClick={() => isUnread && handleMarkRead(n.id)}
                    className={`group relative flex items-start gap-2.5 rounded-xl p-2.5 transition-colors cursor-pointer ${
                      isUnread
                        ? isDueSoon
                          ? "bg-amber-50/80 border border-amber-200/90 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:border-amber-800/60 dark:hover:bg-amber-950/60"
                          : "bg-indigo-50/70 border border-indigo-200/80 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:hover:bg-indigo-950/60"
                        : "border border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="mt-0.5">{getNotificationIcon(n.type)}</div>

                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {String(n.payload?.message || n.payload?.taskTitle || "Notification")}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">{timeStr}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {isUnread ? (
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            isDueSoon ? "bg-amber-500" : "bg-indigo-500"
                          }`}
                        />
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
