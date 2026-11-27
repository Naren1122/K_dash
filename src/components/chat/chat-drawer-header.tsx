"use client";

import { MessageSquare, ChevronLeft, Volume2, VolumeX, X } from "lucide-react";
import type { ChatAuthor } from "@/lib/types/chat-types";

interface ChatDrawerHeaderProps {
  isHubView: boolean;
  activeRecipientId?: string | null;
  partnerName: string;
  activePartner: ChatAuthor | null;
  soundEnabled: boolean;
  toggleSound: () => void;
  openChatHub: () => void;
  closeChat: () => void;
}

export function ChatDrawerHeader({
  isHubView,
  activeRecipientId,
  partnerName,
  activePartner,
  soundEnabled,
  toggleSound,
  openChatHub,
  closeChat,
}: ChatDrawerHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-850/70 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        {isHubView ? (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Chat & Messages
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Team channel & direct messages
              </p>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={openChatHub}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition cursor-pointer"
              title="All conversations"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {activeRecipientId ? partnerName : "# Team Board Chat"}
                </h3>
                {activePartner && (
                  <span className="rounded-md bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 shrink-0">
                    {activePartner.role}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activeRecipientId
                  ? "Direct 1-on-1 Message"
                  : "Public channel for all team members"}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={toggleSound}
          title={soundEnabled ? "Mute chat chime" : "Unmute chat chime"}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <VolumeX className="h-4 w-4 text-slate-400" />
          )}
        </button>

        <button
          type="button"
          onClick={closeChat}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          aria-label="Close Chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
