# Rule: Data Layer & Server Actions

## Layering (strict — do not skip a layer)

```
Component (UI)
   ↓ calls
Server Action  (features/<x>/actions/*.ts)
   — auth/permission check
   — Zod validation
   — calls data layer
   — revalidatePath / emits activity log / notification as needed
   ↓ calls
Data layer      (lib/data/<model>.data.ts)
   — the ONLY place `prisma.*` is called
   — returns typed results, throws typed errors
   ↓ calls
Prisma → PostgreSQL
```

**No component ever calls Prisma directly. No Server Action ever calls Prisma
directly.** Both go through `lib/data/`. This is what makes rule 03 (no duplicated
queries) enforceable.

## Server Action pattern (every action follows this shape)
```ts
"use server";
export async function createTask(input: CreateTaskInput): Promise<ActionResult<Task>> {
  const session = await requireAuth();               // 1. auth
  const parsed = createTaskSchema.safeParse(input);   // 2. validate
  if (!parsed.success) return { success: false, error: parsed.error.message };

  if (session.role !== "ADMIN" && parsed.data.priority) {
    // 3. authorize field-level rules per PRD (Members: view only for priority)
  }

  const task = await createTaskInDb(parsed.data);      // 4. data layer call
  await logActivity({ taskId: task.id, action: "CREATED", userId: session.userId }); // 5. side effects
  revalidatePath("/board");                             // 6. cache invalidation
  return { success: true, data: task };
}
```

## Data layer rules
- One file per Prisma model: `task.data.ts`, `comment.data.ts`, `label.data.ts`, etc.
- Functions are named for what they return, not generic CRUD verbs stacked with
  conditionals: `getOverdueTasks()`, `getTaskWithRelations(id)`, not one giant
  `getTasks(filters)` with 10 optional params doing five different jobs — unless
  it's genuinely one flexible list query, in which case document the filter shape.
- Every list query that can return unbounded rows (comments, activity log,
  notifications) is paginated from day one — don't ship an unpaginated `findMany`
  and add pagination later.
- Shared `include`/`select` fragments are constants (see rule 03 §5), reused across
  functions instead of retyped.

## Optimistic updates (drag-and-drop, comments)
- Update local/UI state immediately on user action.
- On Server Action failure, roll back to the previous state and show a toast — this
  logic lives in ONE reusable hook (e.g. `useOptimisticMutation`), not reimplemented
  per feature.

## Real-time / polling (Phase 3)
- Start with polling or SSE per the PRD's own risk mitigation — don't reach for
  WebSockets until polling is proven insufficient.

## Migrations
- Any `schema.prisma` change requires a plan comment describing the migration,
  and must be run via `npx prisma migrate dev --name <clear_name>` — never hand-edit
  the generated migration SQL unless explicitly asked to.
- Seed data changes go in `prisma/seed.ts`, not ad-hoc scripts.
