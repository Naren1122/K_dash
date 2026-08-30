import { z } from "zod";

function optionalNullableField(maxLength: number, message?: string) {
  return z
    .string()
    .trim()
    .max(maxLength, message)
    .nullish()
    .transform((value) => (value == null || value === "" ? null : value));
}

function optionalNullableDateField() {
  return z
    .union([z.string(), z.date()])
    .nullish()
    .transform((value) => (value == null || value === "" ? null : new Date(value)))
    .superRefine((date, ctx) => {
      if (date === null) return;

      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid date",
        });
        return;
      }

      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Year must be between 1900 and 2100",
        });
        return;
      }

      // Check if date is in the past (before today's local date at 00:00:00)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      // Determine input date at 00:00:00 in UTC & local to be timezone resilient
      const inputUtc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).getTime();
      const inputLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

      if (Math.max(inputUtc, inputLocal) < startOfToday) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Due date cannot be in the past. Please select today or a future date.",
        });
      }
    });
}

import { Priority, TaskStatus } from "@/lib/types/prisma_type";


export const priorities = Object.values(Priority) as [Priority, ...Priority[]];
export type PriorityValue = Priority;

export const prioritySchema = z.nativeEnum(Priority, { message: "Invalid priority" });


export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: optionalNullableField(
    2000,
    "Description must be 2000 characters or fewer",
  ),
  assigneeId: optionalNullableField(100),
  priority: prioritySchema,
  dueDate: optionalNullableDateField(),
  labelIds: z.array(z.string().min(1)).optional().default([]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export type CreateTaskFormValues = z.input<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskIdSchema = z.string().trim().min(1, "Task id is required");

export const taskStatuses = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];
export type TaskStatusValue = TaskStatus;

export const taskStatusSchema = z.nativeEnum(TaskStatus, {
  message: "Invalid task status",
});


export type UpdateTaskStatusInput = {
  taskId: unknown;
  status: unknown;
};

export type ReassignTaskInput = {
  taskId: unknown;
  assigneeId: unknown;
};