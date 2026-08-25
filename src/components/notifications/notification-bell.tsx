"use client";

import { useEffect, useState, useRef } from "react";
import { Trash2, Volume2, VolumeX, Clock, MessageSquare, CheckCircle2, UserCheck, Bell } from "lucide-react";
import {
  markReadAction,
  markAllReadAction,
  deleteNotificationAction,
} from "@/actions/notifications";
import { playNotificationSound } from "@/utils/sound";
import { useActionRunner } from "@/hooks/useActionRunner";
import { getSupabaseBrowserClient } from "@/lib/realtime/supabase-realtime";
import { useNotificationStore } from "@/lib/stores/useNotificationStore";

const SOUND_STORAGE_KEY = "kanban_notification_sound";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { run } = useActionRunner();

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const loading = useNotificationStore((state) => state.loading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsReadOptimistic = useNotificationStore((state) => state.markAsReadOptimistic);
  const markAllAsReadOptimistic = useNotificationStore((state) => state.markAllAsReadOptimistic);
  const deleteNotificationOptimistic = useNotificationStore((state) => state.deleteNotificationOptimistic);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    return saved !== null ? saved === "true" : true;
  });

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
    let interval: NodeJS.Timeout | null = null;

    // 1. Initial Load
    fetchNotifications();

    // 2. Realtime WebSocket listener for instant push updates
    const supabase = getSupabaseBrowserClient();
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

    if (supabase) {
      channel = supabase.channel("kanban_notifications_bell");
      channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Notification" },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    }

    // 3. Fallback background poll (every 30s)
    function startPolling() {
      if (!interval) {
        interval = setInterval(() => {
          if (document.visibilityState === "visible") {
            fetchNotifications();
          }
        }, 30000);
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
        fetchNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    }

    startPolling();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", fetchNotifications);

    return () => {
      stopPolling();
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchNotifications);
    };
  }, [fetchNotifications]);

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
    markAsReadOptimistic(id);
    run(() => markReadAction(id));
  }

  function handleMarkAllRead() {
    markAllAsReadOptimistic();
    run(() => markAllReadAction(), {
      successMessage: "All notifications marked as read",
    });
  }

  function handleDelete(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    deleteNotificationOptimistic(id);
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
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  {unreadCount} new
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? "Mute notification sound" : "Unmute notification sound"}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-sky-600 hover:underline dark:text-sky-400 cursor-pointer"
                >
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
            {loading && notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => {
                const message = (item.payload?.message as string) || "Task updated";
                const isUnread = !item.readAt;

                return (
                  <div
                    key={item.id}
                    onClick={() => isUnread && handleMarkRead(item.id)}
                    className={`group relative flex items-start gap-2.5 rounded-xl p-2 text-xs transition cursor-pointer ${
                      isUnread
                        ? "bg-sky-50/60 text-slate-900 dark:bg-sky-950/20 dark:text-slate-100 font-medium"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="mt-0.5">{getNotificationIcon(item.type)}</div>

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="leading-snug break-words text-[11px]">{message}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Delete notification"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="absolute right-1.5 top-2 opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
