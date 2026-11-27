"use server";

import { getCurrentUser, ActionError } from "@/lib/utils/action-utils";
import { logger } from "@/lib/utils/logger";
import type { CreateActivityLogParams } from "@/lib/types/types";
import {
  createActivityLogInDb,
  findActivityLogsByTaskIdInDb,
} from "@/lib/data/activity.data";

export async function createActivityLog(params: CreateActivityLogParams) {
  try {
    return await createActivityLogInDb(params);
  } catch (error) {
    logger.error("activity_log_creation_failed", { error, taskId: params.taskId });
  }
}

export async function getActivityLogsForTask(taskId: string) {
  return findActivityLogsByTaskIdInDb(taskId);
}

export async function getActivityLogsAction(taskId: string) {
  if (!taskId || typeof taskId !== "string") {
    throw new ActionError(400, "Task ID is required to fetch activity history");
  }
  await getCurrentUser();
  const logs = await getActivityLogsForTask(taskId);
  return { logs };
}
