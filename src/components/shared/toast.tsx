"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

type ToastProps = {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
};

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string; iconBg: string; iconColor: string; textColor: string }> = {
  success: {
    bg: "bg-white",
    border: "border-emerald-200",
    icon: "✓",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    textColor: "text-slate-700",
  },
  error: {
    bg: "bg-white",
    border: "border-red-200",
    icon: "✕",
    iconBg: "bg-red-100",
    iconColor: "text-red-700",
    textColor: "text-slate-700",
  },
  info: {
    bg: "bg-white",
    border: "border-sky-200",
    icon: "ℹ",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    textColor: "text-slate-700",
  },
};

export function Toast({ message, type, onDismiss, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const styles = typeStyles[type];

  useEffect(() => {
    // Trigger enter animation on next frame
    const enterTimer = requestAnimationFrame(() => setVisible(true));

    const dismissTimer = setTimeout(() => {
      setExiting(true);
      // Wait for exit animation to complete before removing
      setTimeout(onDismiss, 300);
    }, duration);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  function handleDismiss() {
    setExiting(true);
    setTimeout(onDismiss, 300);
  }

  return (
    <div
      aria-live="polite"
      role="alert"
      className={`
        pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border
        ${styles.bg} ${styles.border} px-4 py-3 text-sm font-semibold ${styles.textColor}
        shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        sm:max-w-sm
        ${visible && !exiting ? "translate-x-0 opacity-100 scale-100" : "translate-x-8 opacity-0 scale-95"}
      `}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor} text-xs font-bold`}>
        {styles.icon}
      </span>
      <span className="flex-1">{message}</span>
      <button
        aria-label="Dismiss notification"
        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-lg leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        onClick={handleDismiss}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

