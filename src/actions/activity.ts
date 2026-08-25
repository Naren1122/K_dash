"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, ActionError } from "@/utils/action-utils";
import { logger } from "@/utils/logger";
import type { CreateActivityLogParams } from "@/types/types";

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
    logger.error("activity_log_creation_failed", { error, taskId: params.taskId });
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

export async function getActivityLogsAction(taskId: string) {
  if (!taskId || typeof taskId !== "string") {
    throw new ActionError(400, "Task ID is required to fetch activity history");
  }
  await getCurrentUser();
  const logs = await getActivityLogsForTask(taskId);
  return { logs };
}
