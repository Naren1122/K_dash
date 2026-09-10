# ⚡ Kanban Task Board (K-Dash)

A modern, full-stack, enterprise-grade Agile project management platform featuring **Google Gemini AI automation**, **multi-view workspaces (Kanban, List, Calendar, Timeline)**, **real-time team collaboration & chat**, and **granular Role-Based Access Control (RBAC)**.

---

## 🚀 Live Demo

**🔗 [k-dash-rosy.vercel.app](https://k-dash-rosy.vercel.app/)**
> *Click the link above to test the live deployed application on Vercel.*

---

## 🌟 Key Features

### 🤖 1. Gemini AI-Powered Project Intelligence
Integrated with the **Google Gen AI SDK (`@google/genai`)** and **Gemini 3.6 Flash**:

- **✨ Magic Task Creation**: Describe requirements in natural conversational language (e.g., *"Fix mobile auth bug by next Friday, assign to Liam as High priority"*), and AI automatically generates structured tasks with titles, detailed markdown descriptions, priorities, relative/absolute due dates, auto-matched assignees, and relevant labels.
- **📄 Document-to-Task Extraction**: Upload PRDs, design documents, or task specs (**PDF, Word `.docx`, Markdown, `.txt`**). Powered by `mammoth` and Gemini multi-modal processing with built-in guardrails:
  - *Relevance Guardrail*: Detects and rejects non-actionable documents (e.g. poetry, lyrics, unrelated text).
  - *Date Guardrail*: Automatically validates and enforces future/valid deadline dates.
- **🧩 Task Decomposition / Subtask Breakdown**: Deconstruct large epics or complex feature cards into granular, actionable subtasks and checklists with clear progress tracking.
- **📝 Thread & Comment Summarization**: Condense lengthy discussions and task comments into concise executive summaries highlighting **Key Decisions / Consensus**, **Identified Blockers**, and **Next Action Items**.

---

### 🗂️ 2. Multi-View Workspaces

- **📋 Kanban Board**:
  - Smooth, accessible Drag-and-Drop powered by **`@dnd-kit`** (desktop and touch friendly).
  - Per-column **WIP Limits (Work In Progress)** with visual threshold alerts.
  - Dynamic column position management and status workflows.
- **📃 List View**:
  - Dense tabular view with multi-column sorting and paginated browsing.
  - Multi-criteria filtering by **Status**, **Priority**, **Assignee**, **Labels**, and **Due Date Ranges**.
  - Instant live keyword search.
- **📅 Calendar View**:
  - Interactive monthly and weekly schedules plotting task deadlines and delivery milestones.
- **📊 Timeline / Gantt View**:
  - Visual milestone tracking and schedule roadmap for identifying bottlenecks and workload overlaps.

---

### 💬 3. Real-Time Collaboration & Communication

- **💬 Real-Time Team & Direct Chat**: Built-in communication drawer powered by **Supabase Realtime**:
  - Team-wide board channels and 1-on-1 direct messaging.
  - Live typing indicators and real-time online/offline presence indicators.
  - Emoji reactions on messages.
- **🟢 Live Presence Bar**: See which team members are currently online and active on the board.
- **📜 Activity Logs & Audit Trail**: Real-time event log tracking task creations, edits, status transitions, reassignments, and priority shifts.
- **💬 Task Discussion System**: Threaded comments on individual tasks with timestamps and author badges.
- **🔔 Notifications Center**: Real-time notification inbox and unread badges for task assignments, status changes, mentions, comments, and impending due dates.

---

### 🔐 4. Role-Based Access Control (RBAC) & Security

- **Admin vs Member Roles**:
  - **Admin**: Full workspace control (board configuration, column reordering, WIP limits, user invitations, label management, task assignment, deletion, and analytics).
  - **Member**: Focused workflow (view boards, collaborate, update task statuses, manage self-assigned tasks, participate in chat and comments).
- **Defense-in-Depth Security**:
  - Authentication with **Auth.js v5 (NextAuth)**, Bcrypt password hashing, and signed JWT sessions.
  - Independent server-side authorization: Every single Server Action re-verifies session authenticity and role permissions with **Zod** schema validation.
- **✉️ Invitation & Password Management**:
  - Admin-generated invite tokens sent via **Nodemailer SMTP** (Gmail integration).
  - Secure account onboarding, password reset, and forgot password workflows.

---

### 📈 5. Administration & Analytics

- **📊 Productivity Analytics**: Comprehensive metrics dashboard tracking task completion rates, throughput velocity, WIP distribution, and individual team member workloads.
- **🏷️ Label Management**: Color-coded, board-scoped custom tags and taxonomies.
- **⚙️ Workflow Customization**: Create, rename, reorder columns, and define custom WIP limits.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions), [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Artificial Intelligence** | [Google Gen AI SDK (`@google/genai`)](https://www.npmjs.com/package/@google/genai) — Gemini 3.6 Flash |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM v6](https://www.prisma.io/) (with connection pooling) |
| **Realtime Engine** | [Supabase Realtime](https://supabase.com/docs/guides/realtime) |
| **Authentication** | [Auth.js v5](https://authjs.dev/) (`next-auth@beta`) with Credentials Provider |
| **State & Forms** | [Zustand](https://github.com/pmndrs/zustand), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) |
| **Drag and Drop** | [`@dnd-kit/core`](https://dndkit.com/), `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Document Processing** | [`mammoth`](https://www.npmjs.com/package/mammoth) (Word DOCX), Native Buffer (PDF/Text) |
| **Email Service** | [Nodemailer](https://nodemailer.com/) (SMTP) |

---

## 📦 Project Structure

```text
kanban/
├── prisma/
│   ├── schema.prisma              # Database schema & relations
│   └── seed.ts                    # Database bootstrap script
├── src/
│   ├── app/
│   │   ├── (auth)/                # Login, Forgot Password, Reset, Invitations
│   │   ├── (dashboard)/
│   │   │   ├── admin/             # Analytics & Management views
│   │   │   └── board/             # Main Multi-View Board
│   │   ├── api/                   # Route handlers & webhooks
│   │   └── layout.tsx             # Root layout & theme providers
│   ├── components/
│   │   ├── admin/                 # Analytics dashboards & admin controls
│   │   ├── ai/                    # Magic Task, Doc Parser, Decomposer, Thread Summary
│   │   ├── board/                 # Drag-and-drop cards, columns, task details
│   │   ├── chat/                  # Real-time drawer, message feeds, emoji picker
│   │   ├── views/                 # Kanban, List, Calendar, and Timeline views
│   │   ├── notifications/         # Notification dropdown & notification items
│   │   └── ui/                    # Reusable design system primitives
│   ├── lib/
│   │   ├── actions/               # Validated Next.js Server Actions
│   │   ├── ai/                    # Gemini client, parsers, and prompt engineering
│   │   ├── data/                  # Data access layer (Prisma queries)
│   │   ├── realtime/              # Supabase Realtime client & subscription channels
│   │   └── schemas/               # Zod validation schemas for all inputs/outputs
│   └── auth.ts                    # Auth.js configuration & JWT callbacks
└── README.md
```

---

## ⚙️ Setup and Installation

### Prerequisites
- **Node.js**: `v20.x` or later
- **npm** or **pnpm**
- **PostgreSQL Database** (e.g., [Supabase](https://supabase.com/), Neon, or local PostgreSQL)
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))

---

### Step-by-Step Instructions

1. **Clone the repository and install dependencies:**

   ```bash
   git clone https://github.com/Naren1122/K_dash.git
   cd kanban
   npm install
   ```

2. **Configure environment variables:**

   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```

   Fill in your `.env` values:
   ```env
   # Database (Supabase or PostgreSQL)
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

   # Auth.js (NextAuth)
   AUTH_SECRET="your-generated-random-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   AUTH_TRUST_HOST=true

   # Supabase Realtime
   NEXT_PUBLIC_SUPABASE_URL="https://[your-project-ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

   # Google Gemini AI
   GEMINI_API_KEY="your-google-gemini-api-key"

   # Admin Bootstrap Seed Credentials
   SEED_ADMIN_EMAIL="admin@kanban.local"
   SEED_ADMIN_NAME="Avery Admin"
   SEED_ADMIN_PASSWORD="Admin123!"

   # SMTP Email Configuration (Optional - for Invites & Password Reset)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_FROM="Kanban Task Board <your-email@gmail.com>"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Apply database migrations:**

   ```bash
   npx prisma migrate dev
   ```

4. **Seed starter data (Admin account, default boards, labels):**

   ```bash
   npm run db:seed
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Seeded Credentials

When running `npm run db:seed`, the following default accounts are configured for demonstration:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@kanban.local` *(or custom `SEED_ADMIN_EMAIL`)* | `Admin123!` | Full workspace access, analytics, user invitations, AI features |

> *Tip: Admins can invite new Members directly from the user invitation modal in the dashboard.*

---

## 📜 Key NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server on `http://localhost:3000` |
| `npm run build` | Generates Prisma client and creates an optimized production build |
| `npm run start` | Runs the production build server |
| `npm run lint` | Checks codebase with ESLint |
| `npm run db:seed` | Seeds database with initial admin user, board, columns, and labels |
| `npx prisma studio` | Opens Prisma Studio GUI to browse and inspect database records |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
