"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, User, Sparkles, Loader2, Send } from "lucide-react";
import { useTeamChatRealtime } from "@/hooks/useTeamChatRealtime";
import { ChatMessageItemView } from "@/components/chat/chat-message-item";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { EmojiPickerPopover } from "@/components/chat/emoji-picker-popover";
import { ChatDrawerHeader } from "@/components/chat/chat-drawer-header";
import { ChatContactList } from "@/components/chat/chat-contact-list";
import { useChatStore, type ChatStoreState } from "@/lib/stores";

interface TeamChatDrawerProps {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  role: "ADMIN" | "MEMBER";
  boardId?: string;
}

const QUICK_EMOJIS = ["👍", "🚀", "❤️", "🔥", "🎉", "💡"];

export function TeamChatDrawer({
  userId,
  userName,
  userEmail,
  role,
  boardId,
}: TeamChatDrawerProps) {
  const isOpen = useChatStore((state: ChatStoreState) => state.isOpen);
  const activeRecipientId = useChatStore((state: ChatStoreState) => state.activeRecipientId);
  const activeRecipientName = useChatStore((state: ChatStoreState) => state.activeRecipientName);
  const openChatHub = useChatStore((state: ChatStoreState) => state.openChatHub);
  const openTeamChat = useChatStore((state: ChatStoreState) => state.openTeamChat);
  const openDirectChat = useChatStore((state: ChatStoreState) => state.openDirectChat);
  const closeChat = useChatStore((state: ChatStoreState) => state.closeChat);

  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    directConversations,
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

  useEffect(() => {
    setActiveRecipientId(activeRecipientId ?? null);
  }, [activeRecipientId, setActiveRecipientId]);

  const isHubView = activeRecipientId === undefined;

  const activePartner = useMemo(() => {
    if (!activeRecipientId) return null;
    return directConversations.find((c) => c.user.id === activeRecipientId)?.user ?? null;
  }, [activeRecipientId, directConversations]);

  const partnerName = activePartner
    ? activePartner.name || activePartner.email
    : activeRecipientName || "Team Member";

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return directConversations;
    const q = searchQuery.toLowerCase();
    return directConversations.filter(
      (c) =>
        (c.user.name && c.user.name.toLowerCase().includes(q)) ||
        (c.user.email && c.user.email.toLowerCase().includes(q))
    );
  }, [directConversations, searchQuery]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen && !isHubView) {
      scrollToBottom("auto");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeRecipientId, isHubView]);

  useEffect(() => {
    if (isOpen && !isHubView) {
      scrollToBottom("smooth");
    }
  }, [messages, typingUsers, isOpen, isHubView]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    broadcastTyping(val.trim().length > 0);
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

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => (isOpen ? closeChat() : openChatHub())}
          aria-label="Toggle Chat"
          className="group flex items-center gap-2.5 rounded-full border border-sky-500/30 bg-sky-600 px-4 py-2.5 text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-sky-500 hover:shadow-sky-500/25 active:scale-95 cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="h-4.5 w-4.5" />
            <span
              className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ring-2 ring-sky-600 ${
                isConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </div>

          <span className="text-xs font-bold tracking-tight">Chat</span>

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
          <ChatDrawerHeader
            isHubView={isHubView}
            activeRecipientId={activeRecipientId}
            partnerName={partnerName}
            activePartner={activePartner}
            soundEnabled={soundEnabled}
            toggleSound={toggleSound}
            openChatHub={openChatHub}
            closeChat={closeChat}
          />

          {isHubView ? (
            <ChatContactList
              groupUnreadCount={groupUnreadCount}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredConversations={filteredConversations}
              directUnreadMap={directUnreadMap}
              openTeamChat={openTeamChat}
              openDirectChat={openDirectChat}
            />
          ) : (
            <>
              {/* Active Messages Thread */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {isLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                    <span>Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                      {activeRecipientId ? <User className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {activeRecipientId ? `Start a chat with ${partnerName}` : "No messages in Team Chat yet"}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                        {activeRecipientId
                          ? "Messages sent here are private between you two."
                          : "Start the discussion! Send a message or react with quick emojis."}
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

              <TypingIndicator typingUsers={typingUsers} />

              {/* Message Input Footer */}
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
                    onClick={openChatHub}
                    className="text-[11px] font-semibold text-sky-600 hover:underline dark:text-sky-400 cursor-pointer"
                  >
                    Switch Chat
                  </button>
                </div>

                <div className="flex items-end gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/90 p-1.5 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 dark:border-slate-800 dark:bg-slate-800/80 dark:focus-within:border-sky-500 dark:focus-within:bg-slate-800">
                  <EmojiPickerPopover
                    align="left"
                    variant="full"
                    onSelectEmoji={handleAddEmojiToInput}
                    buttonClassName="rounded-xl p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-750 dark:hover:text-slate-100 transition cursor-pointer border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 active:bg-slate-200/80"
                  />

                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      activeRecipientId
                        ? `Message ${partnerName}...`
                        : "Message team... (Enter to send)"
                    }
                    rows={1}
                    className="flex-1 max-h-24 min-h-[32px] resize-none border-0 bg-transparent px-1 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500 scrollbar-none"
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || isSubmitting}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs transition hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 cursor-pointer disabled:cursor-not-allowed"
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
