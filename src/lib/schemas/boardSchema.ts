import { z } from "zod";

const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(100),
  key: z
    .string()
    .trim()
    .min(1, "Board key is required")
    .max(10)
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Key must be alphanumeric uppercase"),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  name: z.string().trim().min(1).max(100).optional(),
  key: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/)
    .optional(),
});

export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

export const boardIdSchema = z.string().min(1, "Board ID is required");

export const createColumnSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  name: z.string().trim().min(1, "Column name is required").max(50),
  status: z.enum(taskStatuses, { message: "Invalid task status" }),
  position: z.number().int().nonnegative().optional(),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
  columnId: z.string().min(1, "Column ID is required"),
  name: z.string().trim().min(1).max(50).optional(),
  position: z.number().int().nonnegative().optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
});

export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;

export const columnIdSchema = z.string().min(1, "Column ID is required");

export const reorderColumnsSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  columnIds: z.array(z.string().min(1)).min(1, "At least one column ID required"),
});

export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
