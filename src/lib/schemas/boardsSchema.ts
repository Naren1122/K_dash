import { z } from "zod";



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

// Re-export column schemas from canonical source of truth
export {
  createColumnSchema,
  type CreateColumnInput,
  updateColumnSchema,
  type UpdateColumnInput,
  columnIdSchema,
  reorderColumnsSchema,
  type ReorderColumnsInput,
} from "./columnSchema";

