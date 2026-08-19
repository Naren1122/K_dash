import { prisma } from "@/lib/types/prisma";

export type CreateActivityLogParams = {
  taskId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
};

export async function createActivityLog(params: CreateActivityLogParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        taskId: params.taskId,
        userId: params.userId,
        action: params.action,
        field: params.field ?? null,
        oldValue: params.oldValue ?? null,
        newValue: params.newValue ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create activity log:", error);
  }
}

export async function getActivityLogsForTask(taskId: string) {
  return prisma.activityLog.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
