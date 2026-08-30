"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Smile } from "lucide-react";

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  align?: "left" | "right";
  variant?: "compact-reaction" | "full";
  buttonClassName?: string;
  triggerIconOnly?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const QUICK_5_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉"];

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
  variant = "compact-reaction",
  buttonClassName = "",
  triggerIconOnly = true,
  onOpenChange,
}: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isCompact = variant === "compact-reaction";

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = isCompact ? 200 : 270;
    const popoverHeight = isCompact ? 46 : 240;

    let top: number;
    if (rect.top >= popoverHeight + 10 || rect.top > 120) {
      top = Math.max(10, rect.top - popoverHeight - 6);
    } else {
      top = rect.bottom + 6;
    }

    let left: number;
    if (align === "left") {
      left = Math.min(rect.left, window.innerWidth - popoverWidth - 16);
    } else {
      left = Math.max(16, rect.right - popoverWidth);
    }

    setCoords({ top, left });
  }, [align, isCompact]);

  const toggleOpen = () => {
    const nextState = !isOpen;
    if (nextState) {
      updatePosition();
    }
    setIsOpen(nextState);
    onOpenChange?.(nextState);
  };

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    setIsOpen(false);
    onOpenChange?.(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    }

    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, onOpenChange, updatePosition]);

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-label="Add emoji reaction"
        className={
          buttonClassName ||
          `rounded-lg p-1 transition cursor-pointer border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 active:bg-slate-100 dark:active:bg-slate-700 ${
            isOpen
              ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          }`
        }
      >
        <Smile className="h-3.5 w-3.5" />
        {!triggerIconOnly && <span className="ml-1 text-xs">Emoji</span>}
      </button>

      {isOpen &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className={
              isCompact
                ? "flex items-center gap-1 rounded-full border border-slate-200/90 bg-white/98 px-2 py-1 shadow-2xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/98 animate-in fade-in zoom-in-95 duration-150"
                : "w-[270px] rounded-2xl border border-slate-200/90 bg-white/98 p-2.5 shadow-2xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/98 animate-in fade-in zoom-in-95 duration-150"
            }
          >
            {isCompact ? (
              /* WhatsApp / Messenger style 5-emoji reaction pill */
              QUICK_5_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  title={`React with ${emoji}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-slate-100 hover:scale-135 active:scale-95 transition-transform duration-150 dark:hover:bg-slate-800 cursor-pointer border-0 outline-none ring-0"
                >
                  {emoji}
                </button>
              ))
            ) : (
              /* Full Multi-Category Emoji Picker for text input */
              <>
                {/* Quick Reaction Row */}
                <div className="mb-2 flex items-center justify-between gap-1 border-b border-slate-100 pb-2 dark:border-slate-800">
                  {["👍", "❤️", "🔥", "🚀", "🎉", "💡", "👏"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-base hover:bg-slate-100 hover:scale-125 transition-all dark:hover:bg-slate-800 cursor-pointer border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-slate-200"
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
                      className={`rounded-md px-2 py-0.5 whitespace-nowrap transition cursor-pointer border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-slate-200 ${
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
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-indigo-50 hover:scale-120 transition-transform dark:hover:bg-indigo-950/60 cursor-pointer border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
