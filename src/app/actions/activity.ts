"use server";

import { getCurrentUser } from "@/lib/utils/action-utils";
import { getActivityLogsForTask } from "@/lib/data/activity";

export async function getActivityLogsAction(taskId: string) {
  await getCurrentUser();
  const logs = await getActivityLogsForTask(taskId);
  return { logs };
}
