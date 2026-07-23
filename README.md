# Kanban Task Board
## 🚀 Live Demo

**🔗 [kanban-seven-henna.vercel.app](https://kanban-seven-henna.vercel.app)**
> **Click the link above to view the deployed application.**

A responsive role-based Kanban board built for the Trilink IT Solution full-stack assessment. It uses Next.js App Router, PostgreSQL with Prisma, and Auth.js credentials authentication.

## Features

- Secure email/password login with bcrypt password hashes
- JWT sessions containing the signed-in user id and role
- Three server-rendered board columns: To Do, In Progress, and Done
- Admins can create, reassign, move, and delete any task
- Members can view the board and move only tasks assigned to them
- Server-side authorization in every mutation, independent of hidden UI controls

## Prerequisites

- Node.js 20 or later
- A Supabase PostgreSQL project (or another PostgreSQL database)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`, then replace the placeholders:

   ```env
   DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://...:5432/postgres"
   AUTH_SECRET="a-long-random-secret"
   ```

   `DATABASE_URL` is the Supabase transaction-mode pooler used at runtime. `DIRECT_URL` is the session/direct connection used by Prisma migrations. Never commit `.env`.

3. Apply migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Seed the demonstration data:

   ```bash
   npx prisma db seed
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Seeded credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@kanban.local` | `Admin123!` |
| Member | `maya@kanban.local` | `Member123!` |
| Member | `liam@kanban.local` | `Member123!` |

These accounts are for local assessment and demonstration only. The seed script is safe to rerun: it updates these users and replaces only the four named starter tasks.

## Useful commands

```bash
# Create a new development migration after changing prisma/schema.prisma
npx prisma migrate dev --name <migration-name>

# Run the seed script
npx prisma db seed

# Validate production compilation
npm run build
```

## Architecture and security

- [`src/app/page.tsx`](src/app/page.tsx) is a Server Component. It calls `auth()` and Prisma on the server, redirects unauthenticated users to `/login`, and passes serializable board data to the client.
- [`auth.ts`](auth.ts) configures the Auth.js Credentials provider. It compares submitted passwords with bcrypt hashes and copies the user id and role into the JWT-backed session.
- [`src/components/board.tsx`](src/components/board.tsx) is the interactive Client Component. It presents controls appropriate to the visible role, but those controls are not the security boundary.
- [`src/app/actions/tasks.ts`](src/app/actions/tasks.ts) contains all writes. Every Server Action re-fetches the session, validates input, and verifies the role. For member status changes, it also re-reads the task and confirms `assigneeId === session.user.id` before updating. Admin-only actions reject members on the server.

The application intentionally uses status dropdowns instead of drag-and-drop; both roles and actions meet the task-board requirements while keeping the UI accessible on touch devices.
