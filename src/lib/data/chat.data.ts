import { prisma } from "@/lib/utils/prisma";
import { chatAuthorSelect } from "@/lib/types/chat-types";
import type { ChatMessageItem, ChatReactionGroup } from "@/lib/types/chat-types";

export function groupReactions(
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

export const chatMessageInclude = {
  user: {
    select: chatAuthorSelect,
  },
  recipient: {
    select: chatAuthorSelect,
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
} as const;

export async function findChatMessagesInDb(
  currentUserId: string,
  recipientId?: string | null,
  boardId?: string,
  limit = 60
): Promise<ChatMessageItem[]> {
  const whereCondition = recipientId
    ? {
        OR: [
          { userId: currentUserId, recipientId },
          { userId: recipientId, recipientId: currentUserId },
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
    include: chatMessageInclude,
  });

  return messages.reverse().map((m) => ({
    id: m.id,
    content: m.content,
    userId: m.userId,
    recipientId: m.recipientId,
    boardId: m.boardId,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    author: m.user,
    recipient: m.recipient,
    reactions: groupReactions(m.reactions),
  }));
}

export async function findDirectConversationsInDb(currentUserId: string) {
  return prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      emailVerified: { not: null },
    },
    select: chatAuthorSelect,
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });
}

export async function findLatestMessageBetweenInDb(userA: string, userB: string) {
  return prisma.chatMessage.findFirst({
    where: {
      OR: [
        { userId: userA, recipientId: userB },
        { userId: userB, recipientId: userA },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      content: true,
      createdAt: true,
      userId: true,
    },
  });
}

export async function createChatMessageInDb(data: {
  content: string;
  userId: string;
  recipientId?: string | null;
  boardId?: string | null;
}) {
  return prisma.chatMessage.create({
    data: {
      content: data.content,
      userId: data.userId,
      recipientId: data.recipientId ?? null,
      boardId: data.boardId ?? null,
    },
    include: chatMessageInclude,
  });
}

export async function findChatMessageByIdInDb(messageId: string) {
  return prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: { id: true, userId: true, recipientId: true },
  });
}

export async function deleteChatMessageInDb(messageId: string) {
  return prisma.chatMessage.delete({
    where: { id: messageId },
  });
}

export async function findChatReactionInDb(messageId: string, userId: string, emoji: string) {
  return prisma.chatReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji,
      },
    },
  });
}

export async function deleteChatReactionInDb(id: string) {
  return prisma.chatReaction.delete({
    where: { id },
  });
}

export async function createChatReactionInDb(messageId: string, userId: string, emoji: string) {
  return prisma.chatReaction.create({
    data: {
      messageId,
      userId,
      emoji,
    },
  });
}

export async function findChatReactionsByMessageInDb(messageId: string) {
  return prisma.chatReaction.findMany({
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
}
