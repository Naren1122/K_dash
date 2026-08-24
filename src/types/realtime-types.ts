import type { BoardTask } from "@/types/types";
import type { TaskStatusValue } from "@/lib/schemas/tasksSchema";

export type PresenceUser = {
  userId: string;
  userName: string;
  userEmail: string;
  role: "ADMIN" | "MEMBER";
  activeTaskId?: string | null;
  onlineAt: string;
};

export type RealtimeTaskMovedPayload = {
  taskId: string;
  status: TaskStatusValue;
  actorId: string;
  actorName: string;
};

export type RealtimeTaskDeletedPayload = {
  taskId: string;
  actorId: string;
  actorName: string;
};

export type RealtimeTaskSavedPayload = {
  task: BoardTask;
  actorId: string;
  actorName: string;
  isNew: boolean;
};

export type BoardRealtimeEvent =
  | { type: "task:moved"; payload: RealtimeTaskMovedPayload }
  | { type: "task:saved"; payload: RealtimeTaskSavedPayload }
  | { type: "task:deleted"; payload: RealtimeTaskDeletedPayload };
