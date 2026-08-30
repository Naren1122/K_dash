"use client";

import type { TypingUser } from "@/lib/types/chat-types";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  let text = "";
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].userName} is typing`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
  } else {
    text = "Several people are typing";
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
      </div>
      <span className="text-[11px] font-medium italic">{text}...</span>
    </div>
  );
}
