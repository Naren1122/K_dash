"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { getInitials } from "@/lib/utils/initials";
import { EmojiPickerPopover } from "@/components/chat/emoji-picker-popover";
import type { ChatMessageItem } from "@/lib/types/chat-types";

interface ChatMessageItemProps {
  message: ChatMessageItem;
  currentUserId: string;
  isAdmin: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

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

function formatTime(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatMessageItemView({
  message,
  currentUserId,
  isAdmin,
  onToggleReaction,
  onDeleteMessage,
}: ChatMessageItemProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const isSelf = message.userId === currentUserId;
  const canDelete = isSelf || isAdmin;
  const authorName = message.author.name || message.author.email?.split("@")[0] || "User";
  const avatarInitials = getInitials(authorName);
  const colorClass = getUserColor(message.userId);

  return (
    <div
      className={`group relative flex items-start gap-2.5 rounded-2xl p-2.5 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
        isSelf ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""
      } ${isEmojiPickerOpen ? "z-30 bg-slate-50/90 dark:bg-slate-800/60" : "z-0"}`}
    >
      {/* User Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs ${colorClass}`}
        title={authorName}
      >
        {avatarInitials}
      </div>

      {/* Message Content Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {authorName}
          </span>

          {message.author.role === "ADMIN" && (
            <span className="rounded-md bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              Admin
            </span>
          )}

          {isSelf && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              (You)
            </span>
          )}

          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Message Text */}
        <p className="mt-1 text-xs leading-relaxed text-slate-800 dark:text-slate-200 break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Reactions Row */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {message.reactions.map((reaction) => {
              const hasReacted = reaction.userIds.includes(currentUserId);
              const tooltip = reaction.userNames.join(", ");

              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() => onToggleReaction(message.id, reaction.emoji)}
                  title={`${tooltip} reacted with ${reaction.emoji}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition cursor-pointer border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 ${
                    hasReacted
                      ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="text-xs">{reaction.emoji}</span>
                  <span className="text-[11px] font-bold">{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover Floating Actions Menu */}
      <div
        className={`absolute right-2 top-2 items-center gap-0.5 rounded-xl border border-slate-200/90 bg-white/95 px-1 py-0.5 shadow-sm backdrop-blur-sm dark:border-slate-700/90 dark:bg-slate-800/95 z-30 ${
          isEmojiPickerOpen ? "flex" : "hidden group-hover:flex"
        }`}
      >
        <EmojiPickerPopover
          align="right"
          onOpenChange={setIsEmojiPickerOpen}
          onSelectEmoji={(emoji) => onToggleReaction(message.id, emoji)}
          buttonClassName={`rounded-lg p-1 transition cursor-pointer border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 active:bg-slate-100 dark:active:bg-slate-700 ${
            isEmojiPickerOpen
              ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          }`}
        />

        {canDelete && (
          <button
            type="button"
            onClick={() => onDeleteMessage(message.id)}
            title="Delete message"
            aria-label="Delete message"
            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 active:bg-rose-50 dark:active:bg-rose-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
