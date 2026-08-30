import { z } from "zod";
import { Priority } from "@/lib/types/prisma_type";


// ==========================================
// 1. Magic Task Creator Schemas
// ==========================================

export const magicTaskRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(2, "Prompt must be at least 2 characters long")
    .max(1000, "Prompt must be 1000 characters or fewer"),
  assignees: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().nullable(),
        email: z.string(),
      })
    )
    .optional()
    .default([]),
  labels: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .optional()
    .default([]),
  currentDate: z.string().optional(),
});

export type MagicTaskRequest = z.infer<typeof magicTaskRequestSchema>;

export const magicTaskResponseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
  labelIds: z.array(z.string()).default([]),
});

export type MagicTaskResponse = z.infer<typeof magicTaskResponseSchema>;

// ==========================================
// 2. Task Decomposer Schemas
// ==========================================

export const decomposeTaskRequestSchema = z.object({
  taskId: z.string().optional(),
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().nullish(),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
});

export type DecomposeTaskRequest = z.infer<typeof decomposeTaskRequestSchema>;

export const subtaskEffortEnum = z.enum(["QUICK_WIN", "STANDARD", "COMPLEX"]);
export type SubtaskEffort = z.infer<typeof subtaskEffortEnum>;

export const decomposedSubtaskSchema = z.object({
  title: z.string().trim().min(1, "Subtask title is required"),
  acceptanceCriteria: z.string().trim().min(1, "Acceptance criteria is required"),
  estimatedEffort: subtaskEffortEnum.default("STANDARD"),
});

export type DecomposedSubtask = z.infer<typeof decomposedSubtaskSchema>;

export const decomposeTaskResponseSchema = z.object({
  summary: z.string().trim(),
  subtasks: z.array(decomposedSubtaskSchema).min(1, "At least one subtask is required"),
});

export type DecomposeTaskResponse = z.infer<typeof decomposeTaskResponseSchema>;

// ==========================================
// 3. Thread Summarizer Schemas
// ==========================================

export const commentThreadItemSchema = z.object({
  id: z.string(),
  authorName: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export type CommentThreadItem = z.infer<typeof commentThreadItemSchema>;

export const summarizeThreadRequestSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  taskTitle: z.string().min(1, "Task title is required"),
  taskDescription: z.string().nullish(),
  comments: z.array(commentThreadItemSchema).min(1, "At least one comment is required"),
});

export type SummarizeThreadRequest = z.infer<typeof summarizeThreadRequestSchema>;

export const threadActionItemSchema = z.object({
  item: z.string().trim().min(1),
  assigneeName: z.string().nullish(),
});

export type ThreadActionItem = z.infer<typeof threadActionItemSchema>;

export const summarizeThreadResponseSchema = z.object({
  consensus: z.array(z.string().trim()).default([]),
  blockers: z.array(z.string().trim()).default([]),
  actionItems: z.array(threadActionItemSchema).default([]),
  markdownSummary: z.string().trim(),
});

export type SummarizeThreadResponse = z.infer<typeof summarizeThreadResponseSchema>;
