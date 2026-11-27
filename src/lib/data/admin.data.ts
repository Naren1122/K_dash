import { prisma } from "@/lib/utils/prisma";
import { TaskStatus } from "@/lib/types/prisma_type";

export async function getAdminDashboardStatsInDb() {
  const results = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
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

  return {
    users: results[0],
    tasksCount: results[1],
    todoCount: results[2],
    inProgressCount: results[3],
    doneCount: results[4],
    labels: results[5],
    boardData: results[6],
  };
}
