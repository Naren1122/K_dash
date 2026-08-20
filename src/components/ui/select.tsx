import { forwardRef } from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition hover:border-slate-300 hover:bg-white focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:border-sky-500 dark:focus:bg-slate-800 dark:focus:ring-sky-950/60 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${className}`}
      {...props}
    />
  );
});