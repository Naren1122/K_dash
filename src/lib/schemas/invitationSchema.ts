import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  name: z.string().trim().max(100).optional().nullable(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type InviteUserFormValues = z.input<typeof inviteUserSchema>;

export const acceptInviteSchema = z
  .object({
    token: z.string().trim().min(1, "Invitation token is required"),
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type AcceptInviteFormValues = z.input<typeof acceptInviteSchema>;
