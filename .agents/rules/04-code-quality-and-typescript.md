# Rule: Code Quality & TypeScript

## TypeScript
- Strict mode is on — never weaken `tsconfig.json` to make an error go away.
- `any` is banned. If the type is genuinely unknown, use `unknown` and narrow it.
- No `// @ts-ignore` / `// @ts-expect-error` without a one-line comment explaining
  why, and only as a last resort after trying to fix the actual type.
- Prefer `type` for unions/utility shapes, `interface` for object shapes that might
  be extended. Be consistent within a file.
- No non-null assertions (`!`) unless immediately preceded by a check that guarantees it,
  with a comment.

## Naming
- Components: `PascalCase.tsx` (`TaskCard.tsx`)
- Hooks: `useCamelCase.ts` (`useTaskFilters.ts`)
- Server Actions: verb-first camelCase file + export (`createTask.ts` → `export async function createTask(...)`)
- Booleans read as questions: `isOverdue`, `hasLabels`, `canEdit` — not `overdue`, `labels_flag`.
- No abbreviations that aren't obvious (`cfg`, `usr`, `tmp`) — write the word out.

## Functions & files
- No magic numbers or strings. `5` minutes for comment edit window →
  `const COMMENT_EDIT_WINDOW_MINUTES = 5` in `constants.ts`, not a bare `5` in the logic.
- A function does one thing. If a function needs a comment to explain "step 1, step
  2, step 3," it's usually three functions.
- Prefer early returns over nested if/else pyramids.
- Pure functions (utils, sorting, formatting) have no side effects and are easy to
  unit test in isolation — keep DB/network calls out of them.

## Error handling
- Server Actions never throw raw errors to the client. Return a typed result:
  ```ts
  type ActionResult<T> = { success: true; data: T } | { success: false; error: string };
  ```
- Catch Prisma errors (e.g. unique constraint violations) and translate to a
  human-readable `error` string — don't leak raw DB error messages to the UI.
- Every `await` that can fail (DB call, external API) is wrapped in try/catch with
  a meaningful fallback — no silent `.catch(() => {})`.

## Comments & docs
- Comment the *why*, not the *what*. Code should be readable enough that "what" is
  obvious from names; comments explain non-obvious decisions or business rules
  (e.g. "// 5 min edit window per PRD 2.1.4").
- Every non-trivial exported function (Server Actions, data-layer functions, complex
  utils) gets a one-line JSDoc summary.

## Imports
- Absolute imports via the `@/` alias, not long relative chains (`../../../../lib`).
- Group imports: external packages → internal `@/` imports → relative imports —
  separated by a blank line.

## Formatting & linting
- Prettier + ESLint run clean before any task is considered done — don't hand back
  code that needs a human to run `--fix`.
- No commented-out dead code left in the diff. Delete it (git history keeps it).
