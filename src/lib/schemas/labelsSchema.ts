import { z } from "zod";

export const labelColors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
] as const;

export const labelColorSchema = z.enum(labelColors, {
  message: "Invalid label color",
});

export const createLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Label name is required")
    .max(50, "Label name must be 50 characters or fewer"),
  color: labelColorSchema,
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type CreateLabelFormValues = z.input<typeof createLabelSchema>;

export const updateLabelSchema = createLabelSchema.extend({
  id: z.string().trim().min(1, "Label id is required"),
});

export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

export const labelIdSchema = z.string().trim().min(1, "Label id is required");