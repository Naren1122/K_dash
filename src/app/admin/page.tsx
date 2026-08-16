import { prisma } from "@/lib/prisma";
import { Role, TaskStatus } from "@/generated/prisma/client";
import { StatCards } from "@/components/admin/stat-cards";
import { UserTable } from "@/components/admin/user-table";

export default async function AdminDashboardPage() {
  const [users, tasksCount, todoCount, inProgressCount, doneCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { assignedTasks: true },
        },
      },
    }),
    prisma.task.count(),
    prisma.task.count({ where: { status: TaskStatus.TODO } }),
    prisma.task.count({ where: { status: TaskStatus.IN_PROGRESS } }),
    prisma.task.count({ where: { status: TaskStatus.DONE } }),
  ]);

  const adminCount = users.filter((u) => u.role === Role.ADMIN).length;
  const memberCount = users.filter((u) => u.role === Role.MEMBER).length;

  const formattedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    assignedTasksCount: u._count.assignedTasks,
  }));

  return (
    <main className="p-6 md:p-8">
      {/* Page Title & Intro */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          System Administration
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Manage system users, board workload metrics, and role-based permissions.
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
    </main>
  );
}
