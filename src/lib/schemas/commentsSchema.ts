import { z } from "zod";

export const createCommentSchema = z.object({
  taskId: z.string().trim().min(1, "Task id is required"),
  content: z
    .string()
    .trim()
    .min(1, "Comment is required")
    .max(2000, "Comment must be 2000 characters or fewer"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateCommentFormValues = z.input<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  commentId: z.string().trim().min(1, "Comment id is required"),
  content: z
    .string()
    .trim()
    .min(1, "Comment is required")
    .max(2000, "Comment must be 2000 characters or fewer"),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export const commentIdSchema = z.string().trim().min(1, "Comment id is required");