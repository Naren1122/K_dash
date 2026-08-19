import { z } from "zod";
import { TaskStatus } from "@/generated/prisma/client";

export const columnStatusSchema = z.nativeEnum(TaskStatus, {
  error: () => ({ message: "Invalid status value" }),
});

export const columnIdSchema = z
  .string()
  .min(1, "Column ID is required");

export const createColumnSchema = z.object({
  name: z
    .string()
    .min(1, "Column name is required")
    .max(50, "Column name must be 50 characters or less")
    .transform((val) => val.trim()),
  status: columnStatusSchema,
  wipLimit: z
    .number()
    .int()
    .min(1, "WIP limit must be at least 1")
    .nullable()
    .optional(),
  boardId: z.string().min(1, "Board ID is required"),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
  columnId: columnIdSchema,
  name: z
    .string()
    .min(1, "Column name is required")
    .max(50, "Column name must be 50 characters or less")
    .transform((val) => val.trim())
    .optional(),
  wipLimit: z
    .number()
    .int()
    .min(1, "WIP limit must be at least 1")
    .nullable()
    .optional(),
});

export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;

export const reorderColumnsSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  columnIds: z.array(columnIdSchema).min(1, "At least one column is required"),
});

export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
