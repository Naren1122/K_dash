# AGENTS.md — Kanban Task Board

This file is the entry point for any AI agent (Antigravity, Cursor, Claude Code, etc.)
working in this repo. Read this first, every session, before touching code.

Detailed rules live in `.agents/rules/`. This file is the map — it tells you which
rule file governs which kind of work. Read the relevant rule file(s) BEFORE writing
code for that area, not after.

## 1. Project Summary
A Kanban project management tool. Current state: 3-column board, role-based auth
(Admin/Member), task CRUD, Auth.js + PostgreSQL + Prisma + Next.js App Router.
We are extending it per `/docs/PRD.md` with priorities, due dates, labels, comments,
drag-and-drop, custom columns, multi-view, notifications, activity log, and analytics.

## 2. Stack (do not deviate without asking)
- Next.js (App Router), TypeScript strict mode
- PostgreSQL + Prisma ORM
- Auth.js (credentials provider)
- Server Actions for mutations (no separate REST/tRPC layer unless explicitly asked)
- Tailwind CSS
- Zod for all validation
- @dnd-kit for drag-and-drop
- Vitest/Jest + React Testing Library for tests

## 3. Non-negotiable global rules
1. **Never invent a new pattern if an existing one already solves the problem.**
   Search the codebase for a similar feature first and follow its shape.
2. **Never touch `prisma/schema.prisma` without calling it out explicitly** in your
   plan and waiting for confirmation — schema changes are migrations, not free edits.
3. **No direct `prisma.*` calls inside components, server actions, or route handlers.**
   All DB access goes through `src/lib/data/*`. See `05-data-layer-and-api.md`.
4. **One feature = one folder.** See `02-file-structure.md`.
5. **No duplicated logic, types, or validation schemas.** See `03-dry-and-data-duplication.md`.
6. **Every server action validates input with the shared Zod schema before doing anything else.**
7. **Every new UI state must handle loading, empty, and error cases** — not just the happy path.
8. **Before marking any task "done": run typecheck, lint, and tests.** See `06-testing-git-workflow.md`.
9. **Keep files small.** If a file crosses ~250 lines or does more than one job, split it.
10. **Ask before adding a new dependency.** Don't silently pull in a new library for
    something the stack already covers.

## 4. Rule files — read before working in that area

| File | Read this before... |
|---|---|
| `.agents/rules/01-ui-ux.md` | Building or editing any component, page, or view |
| `.agents/rules/02-file-structure.md` | Creating any new file or feature |
| `.agents/rules/03-dry-and-data-duplication.md` | Adding a type, schema, query, or business rule |
| `.agents/rules/04-code-quality-and-typescript.md` | Writing any TS/TSX |
| `.agents/rules/05-data-layer-and-api.md` | Touching Prisma, server actions, or data fetching |
| `.agents/rules/06-testing-git-workflow.md` | Finishing any task, opening a PR, committing |

## 5. How to work
1. **Plan first.** Restate the task, list the files you expect to touch, and check
   that plan against the table above. For anything touching the schema, DB access
   layer, or auth, surface the plan before writing code.
2. **Look before you build.** Grep for existing similar features (e.g. "how did we
   build Labels?" before building Comments) and mirror that structure.
3. **Small, reviewable diffs.** Prefer several small server actions/components over
   one large one. Don't refactor unrelated code in the same change.
4. **Say what you didn't do.** If something in the PRD is ambiguous or out of scope
   for the current task, state that assumption instead of guessing silently.
