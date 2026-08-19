import { Role } from "@/generated/prisma/client";

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
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Table Header Section */}
      <div className="flex flex-col gap-2 border-b border-slate-200/80 dark:border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">User Directory & Roles</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            System accounts, permissions, and active workload assignments.
          </p>
        </div>
        <span className="self-start rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 sm:self-auto">
          {users.length} Registered Accounts
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Assigned Tasks</th>
              <th className="px-5 py-3.5">Joined Date</th>
              <th className="px-5 py-3.5 text-right">Permissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
            {users.map((user) => {
              const isAdmin = user.role === Role.ADMIN;
              return (
                <tr key={user.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
                          isAdmin
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
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isAdmin
                          ? "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                          : "bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isAdmin ? "bg-purple-600 dark:bg-purple-400" : "bg-sky-500 dark:bg-sky-400"
                        }`}
                      />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                    {user.assignedTasksCount} {user.assignedTasksCount === 1 ? "task" : "tasks"}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {isAdmin ? "Full Access" : "Member Access"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
