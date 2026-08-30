import type { Role, User } from "@/lib/types/prisma_type";

export type ChatReactionGroup = {
  emoji: string;
  count: number;
  userIds: string[];
  userNames: string[];
};

export type ChatAuthor = Pick<User, "id" | "name" | "email" | "role" | "image">;


export type ChatMessageItem = {
  id: string;
  content: string;
  userId: string;
  recipientId?: string | null;
  boardId?: string | null;
  createdAt: string;
  updatedAt: string;
  author: ChatAuthor;
  recipient?: ChatAuthor | null;
  reactions: ChatReactionGroup[];
};

export type DirectConversationSummary = {
  user: ChatAuthor;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
};

export type TypingUser = {
  userId: string;
  userName: string;
  userRole: Role;
  timestamp: number;
};

export type RealtimeChatMessagePayload = {
  message: ChatMessageItem;
  actorId: string;
  recipientId?: string | null;
};

export type RealtimeChatReactionPayload = {
  messageId: string;
  reactions: ChatReactionGroup[];
  actorId: string;
  actorName: string;
  emoji: string;
  recipientId?: string | null;
};

export type RealtimeChatMessageDeletedPayload = {
  messageId: string;
  actorId: string;
  recipientId?: string | null;
};

export type RealtimeChatTypingPayload = {
  userId: string;
  userName: string;
  userRole: Role;
  isTyping: boolean;
  recipientId?: string | null;
};

export type ChatRealtimeEvent =
  | { type: "chat:message_created"; payload: RealtimeChatMessagePayload }
  | { type: "chat:message_deleted"; payload: RealtimeChatMessageDeletedPayload }
  | { type: "chat:reaction_toggled"; payload: RealtimeChatReactionPayload }
  | { type: "chat:typing"; payload: RealtimeChatTypingPayload };
