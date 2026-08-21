"use client";

import { useEffect, useRef } from "react";
import type { Assignee } from "@/types/types";
import { getInitials } from "@/utils/initials";

type MentionAutocompleteProps = {
  assignees: Assignee[];
  filterText: string;
  onSelect: (user: Assignee) => void;
  onClose: () => void;
};

export function MentionAutocomplete({
  assignees,
  filterText,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = assignees.filter((user) => {
    const query = filterText.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(query) ?? false;
    const emailMatch = user.email.toLowerCase().includes(query);
    return nameMatch || emailMatch;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-1 z-30 w-64 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5"
    >
      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Mention Team Member
      </p>
      <ul className="space-y-0.5">
        {filtered.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-900"
              onClick={() => onSelect(user)}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-100 text-[9px] font-bold text-indigo-700">
                {getInitials(user.name ?? user.email)}
              </span>
              <div className="min-w-0 flex-1 truncate">
                <span className="font-bold text-slate-900">{user.name ?? user.email}</span>
                {user.name ? (
                  <span className="ml-1 truncate text-[10px] text-slate-400">({user.email})</span>
                ) : null}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
