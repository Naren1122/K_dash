import { z } from "zod";

export const loginSchema = z.object({
    email: z.email("Enter a valid email address"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(
            /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
            "Password must contain at least one special character"
        ),
});
export type LoginInput = z.infer<typeof loginSchema>;