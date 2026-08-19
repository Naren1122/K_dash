import { prisma } from "@/lib/types/prisma";

export async function getAnalyticsData() {
  const tasks = await prisma.task.findMany({
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      labels: {
        include: {
          label: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "TODO").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const done = tasks.filter((t) => t.status === "DONE").length;

  const lowPriority = tasks.filter((t) => t.priority === "LOW").length;
  const mediumPriority = tasks.filter((t) => t.priority === "MEDIUM").length;
  const highPriority = tasks.filter((t) => t.priority === "HIGH").length;
  const criticalPriority = tasks.filter((t) => t.priority === "CRITICAL").length;

  const now = new Date();
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
  ).length;

  return {
    metrics: {
      total,
      todo,
      inProgress,
      done,
      overdue,
      priority: {
        low: lowPriority,
        medium: mediumPriority,
        high: highPriority,
        critical: criticalPriority,
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
}
