import { z } from "zod";
function optionalNullableField(maxLength: number, message?: string) {
    return z
        .string()
        .trim()
        .max(maxLength, message)
        .nullish()
        .transform((value) => (value == null || value === "" ? null : value));
}

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
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export type CreateTaskFormValues = z.input<typeof createTaskSchema>;

export const taskIdSchema = z.string().trim().min(1, "Task id is required");

export const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatusValue = (typeof taskStatuses)[number];

export const taskStatusSchema = z.enum(taskStatuses, {
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