"use client";

import { Users, User, Search } from "lucide-react";
import { getInitials } from "@/lib/utils/initials";
import type { DirectConversationSummary } from "@/lib/types/chat-types";

const USER_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

function getUserColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

interface ChatContactListProps {
  groupUnreadCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredConversations: DirectConversationSummary[];
  directUnreadMap: Record<string, number>;
  openTeamChat: () => void;
  openDirectChat: (recipientId: string, recipientName: string) => void;
}

export function ChatContactList({
  groupUnreadCount,
  searchQuery,
  setSearchQuery,
  filteredConversations,
  directUnreadMap,
  openTeamChat,
  openDirectChat,
}: ChatContactListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* Team Workspace Channel */}
      <div>
        <p className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Channels
        </p>
        <button
          type="button"
          onClick={openTeamChat}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50/70 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-sky-800 dark:hover:bg-sky-950/40 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                # Team Board Workspace
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                Public team updates & announcements
              </span>
            </div>
          </div>

          {groupUnreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white">
              {groupUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Direct Messages Directory */}
      <div>
        <div className="flex items-center justify-between px-2 pb-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Direct Messages
          </p>
          <span className="text-[10px] font-semibold text-slate-400">
            {filteredConversations.length}
          </span>
        </div>

        {/* Search Contact Bar */}
        <div className="relative mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member..."
            className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
              <User className="mx-auto h-5 w-5 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No members found
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const u = conv.user;
              const unread = directUnreadMap[u.id] || 0;
              const displayName = u.name || u.email;

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => openDirectChat(u.id, displayName)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs ${getUserColor(
                        u.id
                      )}`}
                    >
                      {getInitials(displayName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {displayName}
                        </span>
                        <span className="rounded-sm bg-slate-200/80 px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                          {u.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                        {conv.lastMessage
                          ? conv.lastMessage.content
                          : u.email}
                      </span>
                    </div>
                  </div>

                  {unread > 0 && (
                    <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[9px] font-extrabold text-white">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
