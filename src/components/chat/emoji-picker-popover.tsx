"use client";

import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  align?: "left" | "right";
  buttonClassName?: string;
  triggerIconOnly?: boolean;
}

const EMOJI_CATEGORIES = [
  {
    name: "Quick Reactions",
    emojis: ["👍", "❤️", "🔥", "🚀", "🎉", "💡", "👏", "👀", "😂", "💯", "✨", "✅", "🙌", "💪", "🎯"],
  },
  {
    name: "Expressions",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐"],
  },
  {
    name: "Gestures & Team",
    emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾"],
  },
  {
    name: "Symbols & Status",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "⭐", "🌟", "✨", "⚡", "☄️", "💥", "🔥", "🌈", "☀️", "🌤️", "⛅", "🎉", "🎊", "🏆", "🥇", "🥈", "🥉", "🏅", "🎯", "🚀", "💡", "📌", "📍", "⏰", "⏱️", "⏳", "⌛", "📊", "📈", "📉", "💻", "📱", "🔔", "📣", "📢", "💬", "💭", "✔️", "❌", "❓", "❗"],
  },
];

export function EmojiPickerPopover({
  onSelectEmoji,
  align = "right",
  buttonClassName = "",
  triggerIconOnly = true,
}: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Add emoji reaction"
        className={
          buttonClassName ||
          "rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
        }
      >
        <Smile className="h-4 w-4" />
        {!triggerIconOnly && <span className="ml-1 text-xs">Emoji</span>}
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 z-50 w-72 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Quick Reaction Row */}
          <div className="mb-2 flex items-center justify-between gap-1 border-b border-slate-100 pb-2 dark:border-slate-800">
            {["👍", "❤️", "🔥", "🚀", "🎉", "💡", "👏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-base hover:bg-slate-100 hover:scale-125 transition-all dark:hover:bg-slate-800 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="mb-2 flex gap-1 overflow-x-auto pb-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 scrollbar-none">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategoryIndex(idx)}
                className={`rounded-md px-2 py-0.5 whitespace-nowrap transition cursor-pointer ${
                  selectedCategoryIndex === idx
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto p-1 text-lg">
            {EMOJI_CATEGORIES[selectedCategoryIndex].emojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => handleSelect(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-indigo-50 hover:scale-120 transition-transform dark:hover:bg-indigo-950/60 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
