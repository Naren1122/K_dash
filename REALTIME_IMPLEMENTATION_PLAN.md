# 🚀 Real-Time Multiplayer & Live Team Chat — Implementation Plan

This document outlines the architecture, data models, UI components, and step-by-step roadmap for adding **Real-Time Multiplayer Synchronization**, **Live Presence**, and an embedded **Real-Time Team Chat with Emojis** to the Kanban Task Board.

---

## 📌 Executive Summary

| Feature | Technology | Cost / Quota |
|---|---|---|
| **Multiplayer Board Sync** | Supabase Realtime (Broadcast) | 100% Free (2M messages/month) |
| **Live Presence Avatars** | Supabase Realtime (Presence) | 100% Free (200 concurrent users) |
| **"Currently Viewing" Card Highlight** | Supabase Realtime (Presence) | Included |
| **Live Team Chat & Emoji Reactions** | Supabase Realtime + PostgreSQL | Included |
| **Instant Notification Push & Toasts** | Supabase Realtime (Broadcast) | Included |

---

## 🏗️ 1. Architecture Overview

```
                      +-----------------------------+
                      |   Next.js App Router (SSR)   |
                      +--------------+--------------+
                                     |
                +--------------------+--------------------+
                |                                         |
     (Reads & Mutations)                         (Realtime WebSocket Channel)
                |                                         |
                v                                         v
   +------------------------+                +------------------------+
   |   PostgreSQL Database  |                |   Supabase Realtime    |
   |   (Prisma ORM Layer)   |                |   (Broadcast & Pres.)  |
   +------------------------+                +-----------+------------+
                                                         |
                         +-------------------------------+-------------------------------+
                         |                               |                               |
                         v                               v                               v
               [Tab 1: Admin Chrome]           [Tab 2: Liam Edge]              [Tab 3: Maya Mobile]
```

### Event Flow:
1. **User Action:** Admin moves a card or posts a chat message.
2. **Server Action:** Database is updated via Prisma in `src/actions/`.
3. **Realtime Broadcast:** The client or server publishes an event over the channel `kanban:board`.
4. **Instant Client Reaction:** All connected tabs receive the payload in < 40ms and update their local state smoothly without a page refresh.

---

## 🗄️ 2. Database Schema Additions (`prisma/schema.prisma`)

To support persistent chat history and emoji reactions across browser sessions:

```prisma
model ChatMessage {
  id        String         @id @default(cuid())
  content   String         @db.Text
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  boardId   String?
  board     Board?         @relation(fields: [boardId], references: [id], onDelete: Cascade)
  reactions ChatReaction[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@index([boardId, createdAt])
  @@index([userId])
}

model ChatReaction {
  id        String      @id @default(cuid())
  messageId String
  message   ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  emoji     String      // e.g., "👍", "🚀", "❤️", "🔥", "🎉"
  createdAt DateTime    @default(now())

  @@unique([messageId, userId, emoji])
  @@index([messageId])
}
```

---

## 🎨 3. UI/UX Feature Breakdown

### A. Live Multi-User Board Sync
* **Real-time Drag & Drop:** When a user drops a card into another column, `task:moved` event is broadcast. Other clients animate the card into the new column instantly.
* **Real-time CRUD:** Task creation, label assignment, priority updates, and deletion reflect immediately.

### B. Live Presence Bar ("Who's Online")
* Floating avatar stack in the top navbar:
  * 🟢 **Admin** (Active)
  * 🟢 **Liam** (Active)
  * 🟢 **Maya** (Active)
* Displays total active users counter badge (`🟢 3 online`).
* Graceful heartbeat detection on browser tab close or network disconnect.

### C. Live "Currently Viewing / Editing" Indicator
* When a user opens a task details modal:
  * That task ID is attached to their presence object.
  * A subtle colored border + badge appears on the card for all other users:
    `👀 Maya is viewing this`

### D. Real-Time Team Chat Drawer with Emojis
* **Toggle Button:** Sleek floating button in bottom-right corner `[💬 Team Chat • 2 Online]`.
* **Drawer Panel:** Slide-out glassmorphism drawer with message history, author avatars, and timestamps.
* **Emoji Picker:** Quick-reaction bar (`😀`, `👍`, `🚀`, `❤️`, `🎉`, `🔥`, `💡`) + full emoji picker.
* **Message Reactions:** Hover over any message to add/toggle emoji reactions with real-time counters.
* **Typing Indicator:** Real-time *"Liam is typing..."* status.
* **Audio Alerts & Unread Badge:** Subtle chime sound on incoming message with unread message badge on the closed drawer.

### E. Real-Time Notification Push
* Replaces the 5-second `setInterval` polling in `notification-bell.tsx`.
* Real-time push for task assignments and mentions.
* Instant floating toast alert on the recipient's screen.

---

## 📁 4. Files to Create and Modify

```
src/
├── lib/
│   └── realtime/
│       └── supabase-realtime.ts       # Supabase browser Realtime client singleton
├── hooks/
│   ├── useBoardRealtime.ts            # Hook for board sync, presence & active task focus
│   └── useTeamChatRealtime.ts         # Hook for chat messages, typing & emoji reactions
├── actions/
│   └── chat.ts                        # Server actions for chat history & reactions
├── components/
│   ├── board/
│   │   ├── live-presence-bar.tsx      # Top-bar active online avatars
│   │   ├── task-card.tsx              # (Update) Add "👀 viewing" badge indicator
│   │   └── droppable-column.tsx       # (Update) Remote drop animations
│   ├── chat/
│   │   ├── team-chat-drawer.tsx       # Slide-out chat container
│   │   ├── chat-message-item.tsx      # Individual message bubble + emoji reactions
│   │   ├── emoji-picker-popover.tsx   # Emoji selection popover
│   │   └── typing-indicator.tsx       # Animated typing dots
│   ├── notifications/
│   │   └── notification-bell.tsx      # (Update) Switch from polling to realtime push
│   └── board.tsx                      # (Update) Mount hooks & pass realtime state
```

---

## ⚙️ 5. Configuration Requirements

Add the following to your `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL="https://nchhpahxstziiwtlryjl.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```
*(Found in your Supabase Dashboard under: **Project Settings** $\rightarrow$ **API** $\rightarrow$ **Project API keys**)*

---

## 🧪 6. Verification & Demo Flow

### Step-by-Step Test Procedure:
1. **Multiplayer Sync:** Open Chrome (Admin) and Edge Incognito (Liam) side by side. Drag a card in Chrome $\rightarrow$ Verify Edge moves the card in < 50ms without reloading.
2. **Online Presence:** Confirm both Admin and Liam appear in the top-right Presence Bar.
3. **Card Focus:** Open a task modal on Chrome $\rightarrow$ Check that Edge shows `👀 Admin is viewing` on that card.
4. **Live Chat & Emojis:** Open the Chat drawer on both windows. Send a message with emojis from Chrome $\rightarrow$ Verify it pops up instantly on Edge with sound. Add a `🚀` reaction on Edge $\rightarrow$ Verify Chrome updates the counter instantly.
5. **Instant Notification:** Assign a task to Liam on Chrome $\rightarrow$ Verify Edge displays an instant toast alert.
