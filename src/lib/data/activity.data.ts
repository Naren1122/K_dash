import { prisma } from "@/lib/utils/prisma";
import { userSummarySelect } from "@/lib/types/types";
import type { CreateActivityLogParams } from "@/lib/types/types";

export async function createActivityLogInDb(params: CreateActivityLogParams) {
  return prisma.activityLog.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      action: params.action,
      field: params.field ?? null,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  });
}

export async function findActivityLogsByTaskIdInDb(taskId: string) {
  return prisma.activityLog.findMany({
    where: { taskId },
    include: {
      user: {
        select: userSummarySelect,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
