import React from "react";
import { Sparkles } from "lucide-react";

type SparkleBadgeProps = {
  text?: string;
  size?: "sm" | "md";
  className?: string;
};

export function SparkleBadge({ text = "AI Powered", size = "sm", className = "" }: SparkleBadgeProps) {
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wide uppercase rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/15 to-pink-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/80 shadow-2xs ${sizeClasses} ${className}`}
    >
      <Sparkles className={size === "sm" ? "h-3 w-3 text-indigo-600 dark:text-indigo-400" : "h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400"} />
      {text}
    </span>
  );
}
