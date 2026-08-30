"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Users,
  User,
  ChevronLeft,
  X,
  Send,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useTeamChatRealtime } from "@/hooks/useTeamChatRealtime";
import { ChatMessageItemView } from "@/components/chat/chat-message-item";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { EmojiPickerPopover } from "@/components/chat/emoji-picker-popover";
import { getInitials } from "@/lib/utils/initials";

interface TeamChatDrawerProps {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  role: "ADMIN" | "MEMBER";
  boardId?: string;
}

const QUICK_EMOJIS = ["👍", "🚀", "❤️", "🔥", "🎉", "💡"];

const USER_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

function getUserColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export function TeamChatDrawer({
  userId,
  userName,
  userEmail,
  role,
  boardId,
}: TeamChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
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
  } = useTeamChatRealtime({
    userId,
    userName,
    userEmail,
    role,
    boardId,
    isDrawerOpen: isOpen,
  });

  const activePartner = directConversations.find(
    (c) => c.user.id === activeRecipientId
  )?.user;

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom("auto");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeRecipientId]);

  useEffect(() => {
    if (isOpen && !showConversationList) {
      scrollToBottom("smooth");
    }
  }, [messages, typingUsers, isOpen, showConversationList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (val.trim().length > 0) {
      broadcastTyping(true);
    } else {
      broadcastTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setInputText("");

    try {
      await sendMessage(trimmed);
    } catch (err) {
      console.error("Failed to send:", err);
      setInputText(trimmed);
    } finally {
      setIsSubmitting(false);
      textareaRef.current?.focus();
    }
  };

  const handleAddEmojiToInput = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const selectGroupChat = () => {
    setActiveRecipientId(null);
    setShowConversationList(false);
  };

  const selectDirectUser = (targetUserId: string) => {
    setActiveRecipientId(targetUserId);
    setShowConversationList(false);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Team Chat"
          className="group flex items-center gap-2.5 rounded-full border border-indigo-500/30 bg-indigo-600 px-4 py-2.5 text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-indigo-700 hover:shadow-indigo-500/25 active:scale-95 cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="h-4.5 w-4.5" />
            <span
              className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ring-2 ring-indigo-600 ${
                isConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </div>

          <span className="text-xs font-bold tracking-tight">Team Chat</span>

          {totalUnreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-extrabold text-white shadow-xs animate-pulse">
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-out Glassmorphic Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[540px] w-96 max-w-[calc(100vw-2.5rem)] flex-col rounded-3xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/95 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-850/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              {showConversationList ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Conversations
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Group and direct messages
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setShowConversationList(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition cursor-pointer"
                    title="All conversations"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {activePartner ? activePartner.name || activePartner.email : "# Team Board Chat"}
                      </h3>
                      {activePartner && (
                        <span className="rounded-md bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 shrink-0">
                          {activePartner.role}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {activePartner ? "Direct 1-on-1 Message" : "Public board channel"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? "Mute chat chime" : "Unmute chat chime"}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                aria-label="Close Chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body: Conversation List or Active Message Thread */}
          {showConversationList ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspace Channels
              </p>

              {/* Group Board Chat Option */}
              <button
                type="button"
                onClick={selectGroupChat}
                className={`w-full flex items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition cursor-pointer ${
                  !activeRecipientId
                    ? "bg-indigo-50/80 border border-indigo-200/80 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate"># Team Board Chat</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Public channel for all team members
                    </p>
                  </div>
                </div>

                {groupUnreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white">
                    {groupUnreadCount}
                  </span>
                )}
              </button>

              <div className="pt-2">
                <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Direct Messages (1-on-1)
                </p>

                {directConversations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No other team members found.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {directConversations.map((conv) => {
                      const isSelected = activeRecipientId === conv.user.id;
                      const initials = getInitials(conv.user.name || conv.user.email);
                      const colorClass = getUserColor(conv.user.id);
                      const unread = directUnreadMap[conv.user.id] || 0;

                      return (
                        <button
                          key={conv.user.id}
                          type="button"
                          onClick={() => selectDirectUser(conv.user.id)}
                          className={`w-full flex items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50/80 border border-indigo-200/80 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${colorClass}`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold truncate">
                                  {conv.user.name || conv.user.email}
                                </p>
                                <span className="rounded-md bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  {conv.user.role}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {conv.lastMessage
                                  ? conv.lastMessage.content
                                  : "Click to start 1-on-1 chat"}
                              </p>
                            </div>
                          </div>

                          {unread > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white animate-pulse">
                              {unread}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Active Messages Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {isLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    <span>Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                      {activePartner ? <User className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {activePartner
                          ? `Start a chat with ${activePartner.name || activePartner.email}`
                          : "No messages yet"}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                        {activePartner
                          ? "Messages sent here are private between you two."
                          : "Start the discussion! Send an update or react with emojis."}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddEmojiToInput(emoji)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-sm transition hover:scale-115 hover:bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ChatMessageItemView
                      key={msg.id}
                      message={msg}
                      currentUserId={userId}
                      isAdmin={role === "ADMIN"}
                      onToggleReaction={toggleReaction}
                      onDeleteMessage={deleteMessage}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              <TypingIndicator typingUsers={typingUsers} />

              {/* Footer & Quick Reactions Bar */}
              <div className="border-t border-slate-100 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
                      Quick:
                    </span>
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleAddEmojiToInput(emoji)}
                        className="rounded-md px-1.5 py-0.5 text-xs transition hover:bg-slate-100 hover:scale-120 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowConversationList(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                  >
                    Switch Chat
                  </button>
                </div>

                {/* Input Form */}
                <div className="flex items-end gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/90 p-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-800 dark:bg-slate-800/80 dark:focus-within:border-indigo-500 dark:focus-within:bg-slate-800">
                  <EmojiPickerPopover
                    align="left"
                    onSelectEmoji={handleAddEmojiToInput}
                    buttonClassName="rounded-xl p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100 transition cursor-pointer"
                  />

                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      activePartner
                        ? `Message ${activePartner.name || "user"}...`
                        : "Type message... (Enter to send)"
                    }
                    rows={1}
                    className="flex-1 max-h-24 min-h-[32px] resize-none border-0 bg-transparent px-1 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500 scrollbar-none"
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || isSubmitting}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Send Message"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
