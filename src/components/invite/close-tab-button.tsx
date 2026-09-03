"use client";

interface CloseTabButtonProps {
  label?: string;
}

export function CloseTabButton({ label = "Done" }: CloseTabButtonProps) {
  function handleClose() {
    window.close();
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.98] cursor-pointer"
    >
      {label}
    </button>
  );
}
