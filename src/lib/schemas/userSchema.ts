import { z } from "zod";

export const roles = ["ADMIN", "MEMBER"] as const;
export type RoleValue = (typeof roles)[number];

export const roleSchema = z.enum(roles);

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, "Name must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
  role: roleSchema.default("MEMBER"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateUserFormValues = z.input<typeof createUserSchema>;
