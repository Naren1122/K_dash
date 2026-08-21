import { prisma } from "@/lib/prisma";
import { Role, TaskStatus, type Prisma } from "@/types/prisma";
import { StatCards } from "@/components/admin/stat-cards";
import { UserTable } from "@/components/admin/user-table";
import { LabelManager } from "@/components/labels/label-manager";
import { ColumnManager } from "@/components/admin/column-manager";

export default async function AdminDashboardPage() {
  type UserWithCount = Prisma.UserGetPayload<{
    select: {
      id: true;
      name: true;
      email: true;
      role: true;
      createdAt: true;
      _count: { select: { assignedTasks: true } };
    };
  }>;

  const results = await Promise.all([
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
    prisma.label.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.board.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        columns: {
          orderBy: { position: "asc" },
          select: { id: true, name: true, position: true, status: true, wipLimit: true, boardId: true },
        },
      },
    }),
  ]);

  const users: UserWithCount[] = results[0];
  const tasksCount = results[1];
  const todoCount = results[2];
  const inProgressCount = results[3];
  const doneCount = results[4];
  const labels = results[5];
  const boardData = results[6];

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
