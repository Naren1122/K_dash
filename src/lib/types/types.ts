import type {
  Prisma,
  Label as PrismaLabel,
  Comment as PrismaComment,
} from "@/lib/types/prisma_type";
import type { TaskStatusValue, PriorityValue } from "@/lib/schemas/tasksSchema";

// Re-export UI constants and date utilities from their dedicated modules
export { columns, statusLabels, type ColumnDefinition } from "@/lib/constants/board";
export { toDateInputValue, dueDateInfo } from "@/lib/utils/dueDate";

/**
 * Basic user summary (id, name, email) used in comment authors and mentions
 */
export const userSummarySelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

export type UserSummary = Prisma.UserGetPayload<{ select: typeof userSummarySelect }>;

/**
 * Public assignee profile (includes verification timestamp)
 */
export const assigneeSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
} satisfies Prisma.UserSelect;

export type Assignee = Prisma.UserGetPayload<{ select: typeof assigneeSelect }>;

export type Label = Pick<PrismaLabel, "id" | "name" | "color">;

export type CreateActivityLogParams = {
  taskId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
};

export type NotificationPayload = {
  taskId?: string;
  taskTitle?: string;
  actorId?: string;
  actorName?: string;
  message?: string;
};

export type Comment = Pick<PrismaComment, "id" | "content"> & {
  createdAt: string;
  updatedAt: string;
  author: UserSummary;
};

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusValue;
  priority: PriorityValue;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: Assignee | null;
  labels: Label[];
  comments: Comment[];
};
