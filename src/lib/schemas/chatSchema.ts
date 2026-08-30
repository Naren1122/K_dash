import { z } from "zod";

export const createChatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
  boardId: z.string().optional(),
  recipientId: z.string().optional(),
});

export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>;

export const toggleChatReactionSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  emoji: z.string().min(1, "Emoji is required").max(10, "Invalid emoji"),
});

export type ToggleChatReactionInput = z.infer<typeof toggleChatReactionSchema>;

export const deleteChatMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

export type DeleteChatMessageInput = z.infer<typeof deleteChatMessageSchema>;
