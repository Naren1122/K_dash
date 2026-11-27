import { create } from "zustand";

export interface ChatStoreState {
  isOpen: boolean;
  activeRecipientId: string | null | undefined; // undefined = Directory Hub, null = Team Board Chat, string = DM userId
  activeRecipientName?: string | null;

  openChatHub: () => void;
  openTeamChat: () => void;
  openDirectChat: (recipientId: string, recipientName?: string | null) => void;
  closeChat: () => void;
  toggleChat: () => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  isOpen: false,
  activeRecipientId: undefined, // Default to directory hub when opening
  activeRecipientName: null,

  openChatHub: () =>
    set({
      isOpen: true,
      activeRecipientId: undefined,
      activeRecipientName: null,
    }),

  openTeamChat: () =>
    set({
      isOpen: true,
      activeRecipientId: null,
      activeRecipientName: null,
    }),

  openDirectChat: (recipientId: string, recipientName?: string | null) =>
    set({
      isOpen: true,
      activeRecipientId: recipientId,
      activeRecipientName: recipientName,
    }),

  closeChat: () =>
    set({
      isOpen: false,
    }),

  toggleChat: () =>
    set((state) => ({
      isOpen: !state.isOpen,
    })),
}));
