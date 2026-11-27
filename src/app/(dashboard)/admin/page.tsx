import { Role } from "@/lib/types/prisma_type";
import { StatCards } from "@/components/admin/stat-cards";
import { UserTable } from "@/components/admin/user-table";
import { LabelManager } from "@/components/labels/label-manager";
import { ColumnManager } from "@/components/admin/column-manager";
import { getAdminDashboardStatsInDb } from "@/lib/data/admin.data";

export default async function AdminDashboardPage() {
  const {
    users,
    tasksCount,
    todoCount,
    inProgressCount,
    doneCount,
    labels,
    boardData,
  } = await getAdminDashboardStatsInDb();

  const adminCount = users.filter((u) => u.role === Role.ADMIN).length;
  const memberCount = users.filter((u) => u.role === Role.MEMBER).length;

  const formattedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: !!u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    assignedTasksCount: u._count.assignedTasks,
  }));

  return (
    <main className="p-6 md:p-8">
      {/* Page Title & Intro */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          System Administration
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Manage system users, board workload metrics, role-based permissions, and workflow columns.
        </p>
      </div>

      {/* Stat Cards */}
      <StatCards
        totalUsers={users.length}
        adminCount={adminCount}
        memberCount={memberCount}
        totalTasks={tasksCount}
        todoCount={todoCount}
        inProgressCount={inProgressCount}
        doneCount={doneCount}
      />

      {/* User Table */}
      <div className="mt-8">
        <UserTable users={formattedUsers} />
      </div>

      {/* Column Workflow Manager */}
      {boardData ? (
        <div className="mt-8">
          <ColumnManager columns={boardData.columns} boardId={boardData.id} />
        </div>
      ) : null}

      {/* Label Manager */}
      <div className="mt-8">
        <LabelManager labels={labels} />
      </div>
    </main>
  );
}
