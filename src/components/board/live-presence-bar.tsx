"use client";

import type { PresenceUser } from "@/lib/types/realtime-types";
import { getInitials } from "@/lib/utils/initials";

type LivePresenceBarProps = {
  onlineUsers: PresenceUser[];
  isConnected: boolean;
  currentUserId: string;
};

const USER_COLORS = [
  "bg-emerald-500 ring-emerald-300 dark:ring-emerald-900",
  "bg-sky-500 ring-sky-300 dark:ring-sky-900",
  "bg-violet-500 ring-violet-300 dark:ring-violet-900",
  "bg-amber-500 ring-amber-300 dark:ring-amber-900",
  "bg-rose-500 ring-rose-300 dark:ring-rose-900",
  "bg-indigo-500 ring-indigo-300 dark:ring-indigo-900",
];

function getUserColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export function LivePresenceBar({
  onlineUsers,
  isConnected,
  currentUserId,
}: LivePresenceBarProps) {
  const displayUsers = onlineUsers.slice(0, 5);
  const extraCount = onlineUsers.length - displayUsers.length;

  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      {/* Realtime Live Status Indicator */}
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <span className="relative flex h-2.5 w-2.5">
          {isConnected ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </>
          ) : (
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          )}
        </span>
        <span className="text-slate-600 dark:text-slate-300 text-[11px] hidden sm:inline">
          {isConnected ? "Live Sync" : "Connecting..."}
        </span>
      </div>

      <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

      {/* Online Users Count & Avatar Stack */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2 overflow-hidden py-0.5">
          {displayUsers.map((user) => {
            const isSelf = user.userId === currentUserId;
            const initials = getInitials(user.userName || user.userEmail);
            const colorClass = getUserColor(user.userId);

            return (
              <div
                key={user.userId}
                className={`relative group flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs ring-2 transition-transform hover:z-10 hover:scale-115 cursor-default ${colorClass}`}
                title={`${user.userName} (${user.role})${isSelf ? " - You" : ""}`}
              >
                <span>{initials}</span>

                {/* Status Dot */}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-white dark:ring-slate-900" />

                {/* Hover Tooltip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-800 pointer-events-none z-30">
                  {user.userName} {isSelf ? "(You)" : ""}
                </div>
              </div>
            );
          })}

          {extraCount > 0 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 ring-2 ring-white dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-900">
              +{extraCount}
            </div>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="text-slate-900 dark:text-white font-bold">
            {onlineUsers.length}
          </span>{" "}
          online
        </span>
      </div>
    </div>
  );
}
