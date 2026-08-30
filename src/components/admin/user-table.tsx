"use client";

import { useMemo, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { CreateUserDialog } from "./create-user-dialog";
import { deleteUser } from "@/lib/actions/users";
import { useActionRunner } from "@/hooks/useActionRunner";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Role } from "@/lib/types/prisma_type";


interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  assignedTasksCount: number;
}

interface UserTableProps {
  users: UserItem[];
}

export function UserTable({ users }: UserTableProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const { run } = useActionRunner();

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, safePage, pageSize]);

  function handleDeleteConfirm() {
    if (!deletingUser) return;
    const target = deletingUser;
    setDeletingUser(null);

    run(() => deleteUser(target.id), {
      successMessage: `Member ${target.name || target.email} has been removed.`,
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-5">
        {/* Table Header Section */}
        <div className="flex flex-col gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">User Directory & Roles</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System accounts, permissions, and active workload assignments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {users.length} Registered Accounts
            </span>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Assigned Tasks</th>
                <th className="px-4 py-3.5">Joined Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
              {paginatedUsers.map((user) => {
                const isAdmin = user.role === "ADMIN";
                return (
                  <tr key={user.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${isAdmin
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                            }`}
                        >
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {user.name || "Unnamed User"}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isAdmin
                          ? "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                          : "bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-purple-600 dark:bg-purple-400" : "bg-sky-500 dark:bg-sky-400"
                            }`}
                        />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                      {user.assignedTasksCount} {user.assignedTasksCount === 1 ? "task" : "tasks"}
                    </td>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {isAdmin ? "Full Access" : "Member Access"}
                        </span>
                        {!isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
                            title={`Delete member ${user.name || user.email}`}
                            aria-label={`Delete member ${user.name || user.email}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={users.length}
          pageSize={pageSize}
        />
      </div>

      {showCreateModal && (
        <CreateUserDialog
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {deletingUser && (
        <ConfirmDialog
          taskTitle={`member account "${deletingUser.name || deletingUser.email}"`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </>
  );
}
