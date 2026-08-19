# Rule: Feature-Based File Structure

## Principle
Organize by **feature/domain**, not by technical type. Someone should be able to
delete `src/features/comments/` and remove the entire comments feature cleanly.
Never scatter one feature's logic across unrelated top-level folders.

## Canonical structure

```
src/
├── app/                        # Next.js routes only — thin. No business logic here.
│   ├── (board)/
│   │   ├── board/page.tsx
│   │   ├── calendar/page.tsx
│   │   └── analytics/page.tsx
│   └── api/                    # Only for things Server Actions can't do (webhooks, etc.)
│
├── features/                   # ← most work happens here
│   ├── tasks/
│   │   ├── components/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   └── CreateTaskForm.tsx
│   │   ├── actions/
│   │   │   ├── createTask.ts
│   │   │   ├── updateTask.ts
│   │   │   └── deleteTask.ts
│   │   ├── hooks/
│   │   │   └── useTaskFilters.ts
│   │   ├── schema.ts           # Zod schemas (shared client+server, see rule 03)
│   │   ├── types.ts            # Types derived FROM schema.ts, not re-declared
│   │   ├── constants.ts        # Priority colors, status labels, etc.
│   │   └── utils/
│   │       └── dueDate.ts
│   ├── labels/                 # same shape
│   ├── comments/                # same shape
│   ├── notifications/           # same shape
│   ├── activity-log/             # same shape
│   ├── boards/                  # boards + columns
│   └── analytics/
│
├── components/
│   └── ui/                     # Design-system primitives ONLY. No feature logic.
│
├── lib/
│   ├── data/                   # Prisma access layer — see rule 05. One file per model.
│   │   ├── task.data.ts
│   │   ├── comment.data.ts
│   │   └── label.data.ts
│   ├── auth/
│   ├── prisma.ts               # single PrismaClient instance
│   └── utils.ts                # truly generic helpers (cn(), formatDate(), etc.)
│
├── types/                      # Cross-feature shared types only (e.g. Session, Enums)
└── prisma/
    └── schema.prisma
```

## Rules
1. **One component = one file.** If a file exports more than one component, split it,
   unless one is a genuinely private sub-component under ~15 lines used nowhere else.
2. **File size ceiling: ~250 lines.** If you're about to exceed it, that's a signal to
   extract a hook, a sub-component, or a helper — not to keep scrolling.
3. **One responsibility per file.** A component file renders UI. A hook file manages
   state/effects. An action file mutates data. Don't mix a Server Action and a
   component in the same file.
4. **Actions are one-verb-per-file** (`createTask.ts`, not a `taskActions.ts` grab-bag
   file with 8 exports) once a feature has more than ~3 actions. Small features (1-2
   actions) can start as a single `actions.ts` and split when they grow.
5. **No `utils.ts` dumping ground per feature.** Name utility files after what they do
   (`dueDate.ts`, `sorting.ts`), not a catch-all.
6. **Barrel files (`index.ts`) are optional, not required.** Only add one if it
   meaningfully cleans up imports for that feature. Never create a barrel that
   re-exports everything from every feature into one giant `src/features/index.ts`
   — that causes circular imports and defeats code-splitting.
7. **Shared UI in `components/ui/`, shared logic in `lib/`, feature-specific
   everything in `features/<name>/`.** If you're unsure whether something is shared,
   default to keeping it inside the feature until a second feature needs it — then
   promote it. Don't pre-abstract.

## Before creating a new file, ask
- Does this belong to an existing feature folder? → put it there.
- Is this UI reusable across ≥2 features already? → `components/ui/`.
- Is this DB access? → `lib/data/`, not inline in the action or component.
