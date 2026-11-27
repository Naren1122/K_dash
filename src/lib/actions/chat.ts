"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@/lib/types/prisma_type";
import {
  createChatMessageSchema,
  CreateChatMessageInput,
  toggleChatReactionSchema,
  ToggleChatReactionInput,
  deleteChatMessageSchema,
} from "@/lib/schemas/chatSchema";
import { getCurrentUser, ActionError, parseOrThrow } from "@/lib/utils/action-utils";
import type {
  ChatMessageItem,
  DirectConversationSummary,
} from "@/lib/types/chat-types";
import {
  findChatMessagesInDb,
  findDirectConversationsInDb,
  findLatestMessageBetweenInDb,
  createChatMessageInDb,
  findChatMessageByIdInDb,
  deleteChatMessageInDb,
  findChatReactionInDb,
  deleteChatReactionInDb,
  createChatReactionInDb,
  findChatReactionsByMessageInDb,
  groupReactions,
} from "@/lib/data/chat.data";

export async function getChatMessages(
  boardId?: string,
  recipientId?: string | null,
  limit = 60
): Promise<ChatMessageItem[]> {
  try {
    const currentUser = await getCurrentUser();
    return findChatMessagesInDb(currentUser.id, recipientId, boardId, limit);
  } catch (error) {
    console.error("Failed to load chat messages:", error);
    return [];
  }
}

export async function getDirectConversationsList(): Promise<DirectConversationSummary[]> {
  try {
    const currentUser = await getCurrentUser();
    const allUsers = await findDirectConversationsInDb(currentUser.id);

    const summaries: DirectConversationSummary[] = await Promise.all(
      allUsers.map(async (user) => {
        const lastMsg = await findLatestMessageBetweenInDb(currentUser.id, user.id);

        return {
          user,
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                createdAt: lastMsg.createdAt.toISOString(),
                senderId: lastMsg.userId,
              }
            : null,
          unreadCount: 0,
        };
      })
    );

    return summaries;
  } catch (error) {
    console.error("Failed to load direct conversations:", error);
    return [];
  }
}

export async function sendChatMessageAction(
  input: CreateChatMessageInput
): Promise<ChatMessageItem | null> {
  try {
    const user = await getCurrentUser();
    const { content, recipientId, boardId } = parseOrThrow(createChatMessageSchema, input);

    const msg = await createChatMessageInDb({
      content,
      userId: user.id,
      recipientId,
      boardId,
    });

    const formatted: ChatMessageItem = {
      id: msg.id,
      content: msg.content,
      userId: msg.userId,
      recipientId: msg.recipientId,
      boardId: msg.boardId,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      author: msg.user,
      recipient: msg.recipient,
      reactions: [],
    };

    revalidatePath("/");
    return formatted;
  } catch (err: unknown) {
    console.error("Failed to send message:", err);
    return null;
  }
}

export async function deleteChatMessageAction(messageId: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    const { messageId: validId } = parseOrThrow(deleteChatMessageSchema, { messageId });

    const msg = await findChatMessageByIdInDb(validId);

    if (!msg) {
      throw new ActionError(404, "Message not found");
    }

    if (msg.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ActionError(403, "You can only delete your own messages");
    }

    await deleteChatMessageInDb(validId);

    revalidatePath("/");
    return { success: true, messageId: validId };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to delete message";
    return { success: false, error };
  }
}

export async function toggleChatReactionAction(input: ToggleChatReactionInput): Promise<{
  success: boolean;
  messageId?: string;
  reactions?: ChatMessageItem["reactions"];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    const { messageId, emoji } = parseOrThrow(toggleChatReactionSchema, input);

    const existingReaction = await findChatReactionInDb(messageId, user.id, emoji);

    if (existingReaction) {
      await deleteChatReactionInDb(existingReaction.id);
    } else {
      await createChatReactionInDb(messageId, user.id, emoji);
    }

    const updatedReactions = await findChatReactionsByMessageInDb(messageId);
    const grouped = groupReactions(updatedReactions);

    revalidatePath("/");
    return { success: true, messageId, reactions: grouped };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to toggle reaction";
    return { success: false, error };
  }
}

export {
  sendChatMessageAction as sendChatMessage,
  toggleChatReactionAction as toggleChatReaction,
  deleteChatMessageAction as deleteChatMessage,
};
