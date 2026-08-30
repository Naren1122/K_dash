"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/realtime/supabase-realtime";
import {
  getChatMessages,
  getDirectConversationsList,
  sendChatMessage,
  toggleChatReaction,
  deleteChatMessage as deleteChatMessageAction,
} from "@/lib/actions/chat";
import { playChatSound } from "@/lib/utils/sound";
import type {
  ChatMessageItem,
  DirectConversationSummary,
  TypingUser,
  RealtimeChatMessagePayload,
  RealtimeChatReactionPayload,
  RealtimeChatMessageDeletedPayload,
  RealtimeChatTypingPayload,
} from "@/lib/types/chat-types";
import type { RealtimeChannel } from "@supabase/supabase-js";

const SOUND_STORAGE_KEY = "kanban_chat_sound_enabled";

type UseTeamChatRealtimeProps = {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  role: "ADMIN" | "MEMBER";
  boardId?: string;
  isDrawerOpen: boolean;
};

export function useTeamChatRealtime({
  userId,
  userName,
  userEmail,
  role,
  boardId,
  isDrawerOpen,
}: UseTeamChatRealtimeProps) {
  const [activeRecipientId, setActiveRecipientIdState] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [directConversations, setDirectConversations] = useState<DirectConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);
  const [directUnreadMap, setDirectUnreadMap] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    return saved !== null ? saved === "true" : true;
  });

  const activeChannelRef = useRef<RealtimeChannel | null>(null);
  const userInboxChannelRef = useRef<RealtimeChannel | null>(null);
  const isDrawerOpenRef = useRef(isDrawerOpen);
  const activeRecipientIdRef = useRef(activeRecipientId);
  const soundEnabledRef = useRef(soundEnabled);
  const displayName = userName || userEmail?.split("@")[0] || "Team Member";

  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  useEffect(() => {
    activeRecipientIdRef.current = activeRecipientId;
  }, [activeRecipientId]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      }
      if (next) {
        playChatSound();
      }
      return next;
    });
  }, []);

  const setActiveRecipientId = useCallback((id: string | null) => {
    setActiveRecipientIdState(id);
    if (id) {
      setDirectUnreadMap((prev) => ({ ...prev, [id]: 0 }));
    } else {
      setGroupUnreadCount(0);
    }
  }, []);

  // 1. Initial Load of Direct Conversations List
  useEffect(() => {
    let mounted = true;

    getDirectConversationsList()
      .then((list) => {
        if (mounted) {
          setDirectConversations(list);
        }
      })
      .catch((err) => {
        console.error("Failed to load direct conversations:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Messages for Active Thread (Group or DM)
  useEffect(() => {
    let mounted = true;

    getChatMessages(boardId, activeRecipientId, 60)
      .then((data) => {
        if (mounted) {
          setMessages(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading chat messages:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [boardId, activeRecipientId]);

  // 3. User Personal Inbox Channel (Receives DM alerts from any sender)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const inboxChannel = supabase.channel(`kanban_user_inbox_${userId}`, {
      config: { broadcast: { ack: false } },
    });

    userInboxChannelRef.current = inboxChannel;

    inboxChannel.on(
      "broadcast",
      { event: "dm:notify" },
      ({ payload }: { payload: { message: ChatMessageItem; senderId: string } }) => {
        const senderId = payload.senderId;
        const isCurrentActiveDM =
          isDrawerOpenRef.current && activeRecipientIdRef.current === senderId;

        if (!isCurrentActiveDM) {
          setDirectUnreadMap((prev) => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          }));
          if (soundEnabledRef.current) {
            playChatSound();
          }
        }

        // Update direct conversation last message
        setDirectConversations((prev) =>
          prev.map((c) =>
            c.user.id === senderId
              ? {
                  ...c,
                  lastMessage: {
                    content: payload.message.content,
                    createdAt: payload.message.createdAt,
                    senderId,
                  },
                }
              : c
          )
        );
      }
    );

    inboxChannel.subscribe();

    return () => {
      supabase.removeChannel(inboxChannel);
      userInboxChannelRef.current = null;
    };
  }, [userId]);

  // 4. Realtime Subscription for Active Chat Channel
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channelName = activeRecipientId
      ? `kanban_dm_${[userId, activeRecipientId].sort().join("_")}`
      : `kanban_team_chat_${boardId || "global"}`;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { ack: false } },
    });

    activeChannelRef.current = channel;

    // A. Message Created
    channel.on(
      "broadcast",
      { event: "chat:message_created" },
      ({ payload }: { payload: RealtimeChatMessagePayload }) => {
        const incomingMsg = payload.message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });

        if (payload.actorId !== userId) {
          if (!isDrawerOpenRef.current) {
            if (activeRecipientIdRef.current) {
              setDirectUnreadMap((prev) => ({
                ...prev,
                [activeRecipientIdRef.current!]:
                  (prev[activeRecipientIdRef.current!] || 0) + 1,
              }));
            } else {
              setGroupUnreadCount((c) => c + 1);
            }
          }
          if (soundEnabledRef.current) {
            playChatSound();
          }
        }
      }
    );

    // B. Reaction Toggled
    channel.on(
      "broadcast",
      { event: "chat:reaction_toggled" },
      ({ payload }: { payload: RealtimeChatReactionPayload }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.messageId
              ? { ...msg, reactions: payload.reactions }
              : msg
          )
        );
      }
    );

    // C. Message Deleted
    channel.on(
      "broadcast",
      { event: "chat:message_deleted" },
      ({ payload }: { payload: RealtimeChatMessageDeletedPayload }) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.messageId));
      }
    );

    // D. Typing Broadcast
    channel.on(
      "broadcast",
      { event: "chat:typing" },
      ({ payload }: { payload: RealtimeChatTypingPayload }) => {
        if (payload.userId === userId) return;

        setTypingUsers((prev) => {
          if (!payload.isTyping) {
            return prev.filter((u) => u.userId !== payload.userId);
          }

          const existingIndex = prev.findIndex((u) => u.userId === payload.userId);
          const entry: TypingUser = {
            userId: payload.userId,
            userName: payload.userName,
            userRole: payload.userRole,
            timestamp: Date.now(),
          };

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = entry;
            return updated;
          }

          return [...prev, entry];
        });
      }
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      activeChannelRef.current = null;
    };
  }, [boardId, activeRecipientId, userId]);

  // 5. Typing indicator auto-cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => now - u.timestamp < 3500);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // 6. Typing sender
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sendTypingBroadcast = useCallback(
    (isTyping: boolean) => {
      if (!activeChannelRef.current) return;
      activeChannelRef.current.send({
        type: "broadcast",
        event: "chat:typing",
        payload: {
          userId,
          userName: displayName,
          userRole: role,
          isTyping,
          recipientId: activeRecipientId,
        },
      });
    },
    [userId, displayName, role, activeRecipientId]
  );

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      sendTypingBroadcast(isTyping);

      if (isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          sendTypingBroadcast(false);
        }, 3000);
      }
    },
    [sendTypingBroadcast]
  );

  // 7. Send message action
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      sendTypingBroadcast(false);

      try {
        const createdMessage = await sendChatMessage({
          content: trimmed,
          boardId: activeRecipientId ? undefined : boardId,
          recipientId: activeRecipientId || undefined,
        });

        if (createdMessage) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === createdMessage.id)) return prev;
            return [...prev, createdMessage];
          });

          // Broadcast to active channel
          if (activeChannelRef.current) {
            activeChannelRef.current.send({
              type: "broadcast",
              event: "chat:message_created",
              payload: {
                message: createdMessage,
                actorId: userId,
                recipientId: activeRecipientId,
              },
            });
          }

          // If DM, notify recipient's personal inbox channel
          if (activeRecipientId) {
            const supabase = getSupabaseBrowserClient();
            if (supabase) {
              const recipientInbox = supabase.channel(
                `kanban_user_inbox_${activeRecipientId}`
              );
              recipientInbox.subscribe((status) => {
                if (status === "SUBSCRIBED") {
                  recipientInbox.send({
                    type: "broadcast",
                    event: "dm:notify",
                    payload: {
                      message: createdMessage,
                      senderId: userId,
                    },
                  });
                  setTimeout(() => supabase.removeChannel(recipientInbox), 1000);
                }
              });
            }

            // Update local conversation summary
            setDirectConversations((prev) =>
              prev.map((c) =>
                c.user.id === activeRecipientId
                  ? {
                      ...c,
                      lastMessage: {
                        content: trimmed,
                        createdAt: createdMessage.createdAt,
                        senderId: userId,
                      },
                    }
                  : c
              )
            );
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [boardId, activeRecipientId, userId, sendTypingBroadcast]
  );

  // 8. Toggle Reaction action
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;

          const existingIndex = msg.reactions.findIndex((r) => r.emoji === emoji);
          let newReactions = [...msg.reactions];

          if (existingIndex >= 0) {
            const current = newReactions[existingIndex];
            const hasUser = current.userIds.includes(userId);
            if (hasUser) {
              const updatedUserIds = current.userIds.filter((id) => id !== userId);
              const updatedUserNames = current.userNames.filter((name) => name !== displayName);
              if (updatedUserIds.length === 0) {
                newReactions = newReactions.filter((r) => r.emoji !== emoji);
              } else {
                newReactions[existingIndex] = {
                  ...current,
                  count: updatedUserIds.length,
                  userIds: updatedUserIds,
                  userNames: updatedUserNames,
                };
              }
            } else {
              newReactions[existingIndex] = {
                ...current,
                count: current.count + 1,
                userIds: [...current.userIds, userId],
                userNames: [...current.userNames, displayName],
              };
            }
          } else {
            newReactions.push({
              emoji,
              count: 1,
              userIds: [userId],
              userNames: [displayName],
            });
          }

          return { ...msg, reactions: newReactions };
        })
      );

      try {
        const result = await toggleChatReaction({ messageId, emoji });
        if (result && activeChannelRef.current) {
          activeChannelRef.current.send({
            type: "broadcast",
            event: "chat:reaction_toggled",
            payload: {
              messageId,
              reactions: result.reactions,
              actorId: userId,
              actorName: displayName,
              emoji,
              recipientId: activeRecipientId,
            },
          });
        }
      } catch (error) {
        console.error("Failed to toggle reaction:", error);
      }
    },
    [userId, displayName, activeRecipientId]
  );

  // 9. Delete Message action
  const deleteMessage = useCallback(
    async (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        await deleteChatMessageAction(messageId);
        if (activeChannelRef.current) {
          activeChannelRef.current.send({
            type: "broadcast",
            event: "chat:message_deleted",
            payload: {
              messageId,
              actorId: userId,
              recipientId: activeRecipientId,
            },
          });
        }
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    },
    [userId, activeRecipientId]
  );

  const totalUnreadCount = useMemo(() => {
    const directTotal = Object.values(directUnreadMap).reduce((a, b) => a + b, 0);
    return groupUnreadCount + directTotal;
  }, [groupUnreadCount, directUnreadMap]);

  return {
    messages,
    directConversations,
    activeRecipientId,
    setActiveRecipientId,
    isLoading,
    totalUnreadCount,
    groupUnreadCount,
    directUnreadMap,
    typingUsers,
    isConnected,
    soundEnabled,
    toggleSound,
    sendMessage,
    toggleReaction,
    deleteMessage,
    broadcastTyping,
    clearUnreadCount: () => {
      setGroupUnreadCount(0);
      setDirectUnreadMap({});
    },
  };
}
