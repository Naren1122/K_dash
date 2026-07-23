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
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-heading"
    >
      {/* Dialog card */}
      <div
        className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.5)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl text-red-600">!</span>
        </div>

        {/* Heading */}
        <h2
          className="mt-4 text-center text-lg font-bold text-slate-900"
          id="confirm-dialog-heading"
        >
          Are you sure you want to delete this task?
        </h2>

        {/* Task title context */}
        <p className="mt-2 text-center text-sm text-slate-500">
          <span className="font-medium text-slate-700">&ldquo;{taskTitle}&rdquo;</span> will be permanently deleted. This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            className="order-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 sm:order-1"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            className="order-1 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-200 sm:order-2"
            onClick={handleConfirm}
            type="button"
          >
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}

