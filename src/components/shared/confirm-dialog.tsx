"use client";

import { useEffect, useRef, useState } from "react";

type ConfirmDialogProps = {
  /** The title of the task being deleted */
  taskTitle: string;
  /** Called when user confirms deletion */
  onConfirm: () => void;
  /** Called when user cancels or dialog is dismissed */
  onCancel: () => void;
};

export function ConfirmDialog({ taskTitle, onConfirm, onCancel }: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Trigger enter animation on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Focus the confirm button for keyboard accessibility
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Prevent background scroll while dialog is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function handleConfirm() {
    onConfirm();
  }

  function handleBackdropClick(event: React.MouseEvent) {
    // Only dismiss if clicking the backdrop itself, not the card
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }

  return (
    // Backdrop
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-heading"
    >
      {/* Dialog card */}
      <div
        className={`w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:border-slate-800 dark:bg-slate-900 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        {/* Warning Icon Badge */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        {/* Heading */}
        <h2
          className="mt-4 text-center text-lg font-black text-slate-950 dark:text-white"
          id="confirm-dialog-heading"
        >
          Delete Task?
        </h2>

        {/* Task title context */}
        <p className="mt-2 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">&ldquo;{taskTitle}&rdquo;</span>? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 active:scale-[0.98] cursor-pointer"
            onClick={handleConfirm}
            type="button"
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}

