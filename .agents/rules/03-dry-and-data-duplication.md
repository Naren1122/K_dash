# Rule: DRY & Data Duplication

This is the rule most likely to get violated silently by an agent working fast —
enforce it deliberately.

## 1. Single source of truth for types
- `prisma/schema.prisma` is the source of truth for shape of persisted data.
- Never hand-write a TypeScript interface that re-describes a Prisma model
  (e.g. don't write `interface Task { id: string; title: string; ... }` by hand).
  Use `import type { Task } from "@prisma/client"` and extend/pick from it if needed:
  ```ts
  import type { Task, Label, Comment } from "@prisma/client";
  export type TaskWithRelations = Task & { labels: Label[]; comments: Comment[] };
  ```
- Enums (`Priority`, `TaskStatus`, `BoardRole`, `NotificationType`) are defined ONCE
  in `schema.prisma` and imported from `@prisma/client` everywhere. Never redeclare
  `type Priority = "LOW" | "MEDIUM" | ...` anywhere in the app code.

## 2. Single source of truth for validation
- One Zod schema per entity, in `features/<feature>/schema.ts`.
- That same schema is used:
  - client-side (form validation, e.g. with `zodResolver`)
  - server-side (first line of every Server Action)
  - Never write a second, slightly-different validation schema for the same entity.
- Derive TS types from Zod where the shape is input/DTO-shaped, not DB-shaped:
  ```ts
  export const createTaskSchema = z.object({ title: z.string().min(1), priority: z.nativeEnum(Priority), ... });
  export type CreateTaskInput = z.infer<typeof createTaskSchema>;
  ```

## 3. Single source of truth for business logic
Logic that must exist in exactly one place, imported everywhere it's needed:
- "Is this task overdue / due soon" → `features/tasks/utils/dueDate.ts`
- "Sort tasks by priority" → `features/tasks/utils/sorting.ts`
- "Can this user edit/delete this comment" (5-min window + Admin override) →
  `features/comments/utils/permissions.ts`
- "What columns does this board have" (default vs custom) →
  `features/boards/utils/columns.ts`

If you find yourself about to copy-paste a conditional or a small function into a
second file, stop — extract it and import it instead.

## 4. Don't store what you can derive
- **Never add a DB column for a value that can be computed from other columns**
  (e.g. no `isOverdue` boolean on Task — compute it from `dueDate` at read time).
  Storing derived state creates two sources of truth that can go out of sync.
- Exception: values that are expensive to compute repeatedly at scale (e.g.
  pre-aggregated analytics for the dashboard) — those get an explicit comment
  explaining why they're denormalized and how they're kept in sync.

## 5. Data-fetching duplication
- All Prisma queries for a given model live in `lib/data/<model>.data.ts`. If two
  Server Actions need "task with labels and comments," they both call the SAME
  `getTaskWithRelations(id)` function — never write the same `prisma.task.findUnique`
  with the same `include` block in two places.
- Reuse Prisma `select`/`include` fragments via constants:
  ```ts
  // lib/data/task.data.ts
  export const taskWithRelationsInclude = { labels: { include: { label: true } }, comments: true } as const;
  ```

## 6. UI duplication
- Any JSX pattern that appears 2+ times (badge, empty state, confirm dialog) becomes
  a shared component before the third copy-paste, not after.
- Filtering logic used by both Kanban and List views (per PRD 2.2.3 "each view
  shares same filters") lives in ONE hook — `features/tasks/hooks/useTaskFilters.ts`
  — consumed by both views. Do not implement filtering twice.

## 7. Red flags to self-check before finishing a task
- Did I write a type that Prisma already generates?
- Did I write a validation rule that already exists in another schema.ts?
- Did I copy a function/component and change one line, instead of parameterizing it?
- Did I add a Prisma query that looks like one that already exists elsewhere?
If any answer is yes, refactor before calling the task done.
