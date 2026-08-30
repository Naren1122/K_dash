"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/utils/prisma";
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
  ChatReactionGroup,
  DirectConversationSummary,
} from "@/lib/types/chat-types";

function groupReactions(
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
    user: { name: string | null; email: string | null };
  }>
): ChatReactionGroup[] {
  const map = new Map<string, { count: number; userIds: string[]; userNames: string[] }>();

  for (const r of reactions) {
    const existing = map.get(r.emoji);
    const userName = r.user.name || r.user.email?.split("@")[0] || "User";
    if (existing) {
      existing.count += 1;
      existing.userIds.push(r.userId);
      existing.userNames.push(userName);
    } else {
      map.set(r.emoji, {
        count: 1,
        userIds: [r.userId],
        userNames: [userName],
      });
    }
  }

  return Array.from(map.entries()).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    userIds: data.userIds,
    userNames: data.userNames,
  }));
}

export async function getChatMessages(
  boardId?: string,
  recipientId?: string | null,
  limit = 60
): Promise<ChatMessageItem[]> {
  try {
    const currentUser = await getCurrentUser();

    // Determine query filter: 1-on-1 Direct Message vs Group Board Chat
    const whereCondition = recipientId
      ? {
        OR: [
          { userId: currentUser.id, recipientId },
          { userId: recipientId, recipientId: currentUser.id },
        ],
      }
      : {
        recipientId: null,
        boardId: boardId || undefined,
      };

    const messages = await prisma.chatMessage.findMany({
      where: whereCondition,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return messages.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      userId: msg.userId,
      recipientId: msg.recipientId,
      boardId: msg.boardId,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      author: {
        id: msg.user.id,
        name: msg.user.name,
        email: msg.user.email,
        role: msg.user.role,
        image: msg.user.image,
      },
      recipient: msg.recipient
        ? {
          id: msg.recipient.id,
          name: msg.recipient.name,
          email: msg.recipient.email,
          role: msg.recipient.role,
          image: msg.recipient.image,
        }
        : null,
      reactions: groupReactions(msg.reactions || []),
    }));
  } catch (error) {
    console.error("Failed to load chat messages:", error);
    return [];
  }
}

export async function getDirectConversationsList(): Promise<DirectConversationSummary[]> {
  try {
    const currentUser = await getCurrentUser();

    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: currentUser.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });

    const summaries: DirectConversationSummary[] = await Promise.all(
      allUsers.map(async (user) => {
        const lastMsg = await prisma.chatMessage.findFirst({
          where: {
            OR: [
              { userId: currentUser.id, recipientId: user.id },
              { userId: user.id, recipientId: currentUser.id },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            createdAt: true,
            userId: true,
          },
        });

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          },
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
    console.error("Failed to load direct conversations list:", error);
    return [];
  }
}

export async function sendChatMessage(
  input: CreateChatMessageInput
): Promise<ChatMessageItem> {
  const user = await getCurrentUser();
  const { content, boardId, recipientId } = parseOrThrow(createChatMessageSchema, input);

  const created = await prisma.chatMessage.create({
    data: {
      content,
      userId: user.id,
      boardId: recipientId ? null : boardId || null,
      recipientId: recipientId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      },
    },
  });

  revalidatePath("/");

  return {
    id: created.id,
    content: created.content,
    userId: created.userId,
    recipientId: created.recipientId,
    boardId: created.boardId,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    author: {
      id: created.user.id,
      name: created.user.name,
      email: created.user.email,
      role: created.user.role,
      image: created.user.image,
    },
    recipient: created.recipient
      ? {
        id: created.recipient.id,
        name: created.recipient.name,
        email: created.recipient.email,
        role: created.recipient.role,
        image: created.recipient.image,
      }
      : null,
    reactions: [],
  };
}

export async function toggleChatReaction(
  input: ToggleChatReactionInput
): Promise<{ messageId: string; reactions: ChatReactionGroup[] }> {
  const user = await getCurrentUser();
  const { messageId, emoji } = parseOrThrow(toggleChatReactionSchema, input);

  const existing = await prisma.chatReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.chatReaction.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.chatReaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji,
      },
    });
  }

  const allReactions = await prisma.chatReaction.findMany({
    where: { messageId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    messageId,
    reactions: groupReactions(allReactions),
  };
}

export async function deleteChatMessage(messageId: string): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  parseOrThrow(deleteChatMessageSchema, { messageId });

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: { id: true, userId: true },
  });

  if (!message) {
    throw new ActionError(404, "Message not found");
  }

  if (message.userId !== user.id && user.role !== Role.ADMIN) {
    throw new ActionError(403, "You can only delete your own messages");
  }

  await prisma.chatMessage.delete({
    where: { id: messageId },
  });

  revalidatePath("/");

  return { success: true };
}
