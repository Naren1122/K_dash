import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getAnalyticsData = cache(async () => {
  const now = new Date();

  const [statusGroups, priorityGroups, overdueCount, totalCount, tasks] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      _count: { _all: true },
    }),
    prisma.task.count({
      where: {
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
    }),
    prisma.task.count(),
    prisma.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        assignee: {
          select: { name: true, email: true },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const statusMap = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all])
  );
  const priorityMap = Object.fromEntries(
    priorityGroups.map((g) => [g.priority, g._count._all])
  );

  return {
    metrics: {
      total: totalCount,
      todo: statusMap.TODO || 0,
      inProgress: statusMap.IN_PROGRESS || 0,
      done: statusMap.DONE || 0,
      overdue: overdueCount,
      priority: {
        low: priorityMap.LOW || 0,
        medium: priorityMap.MEDIUM || 0,
        high: priorityMap.HIGH || 0,
        critical: priorityMap.CRITICAL || 0,
      },
    },
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      assignee: t.assignee?.name || t.assignee?.email || "Unassigned",
      creator: t.createdBy.name || t.createdBy.email,
      createdAt: t.createdAt.toISOString(),
    })),
  };
});
