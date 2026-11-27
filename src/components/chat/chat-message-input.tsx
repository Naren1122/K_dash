"use client";

import { RefObject } from "react";
import { Send, Loader2 } from "lucide-react";
import { EmojiPickerPopover } from "@/components/chat/emoji-picker-popover";

const QUICK_EMOJIS = ["👍", "🚀", "❤️", "🔥", "🎉", "💡"];

interface ChatMessageInputProps {
  inputText: string;
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSend: () => void;
  handleAddEmojiToInput: (emoji: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  activeRecipientId?: string | null;
  partnerName: string;
}

export function ChatMessageInput({
  inputText,
  isSubmitting,
  handleInputChange,
  handleKeyDown,
  handleSend,
  handleAddEmojiToInput,
  textareaRef,
  activeRecipientId,
  partnerName,
}: ChatMessageInputProps) {
  return (
    <div className="border-t border-slate-100 bg-slate-50/90 p-3 dark:border-slate-800 dark:bg-slate-850/80 backdrop-blur-sm">
      {/* Quick emoji reaction strip */}
      <div className="mb-2 flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmojiToInput(emoji)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-xs hover:bg-slate-200/70 active:scale-95 dark:hover:bg-slate-700/60 transition cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <EmojiPickerPopover onSelectEmoji={handleAddEmojiToInput} />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${activeRecipientId ? partnerName : "everyone"}...`}
          rows={1}
          className="max-h-24 min-h-[38px] flex-1 resize-none rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-sky-950/60"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || isSubmitting}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm transition hover:bg-sky-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
