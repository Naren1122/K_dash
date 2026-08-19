# Rule: Testing, Git & Definition of Done

## Testing expectations
- `lib/data/*` and `features/*/utils/*` (pure logic): unit tests required for every
  new function — these are cheap to test and catch regressions in due-date/priority/
  permission logic.
- Server Actions: at least one integration test per action covering the happy path
  and one failure path (validation failure or permission denial).
- Components with real logic (filtering, forms, drag-and-drop handlers): render
  tests with React Testing Library. Pure presentational components don't need tests.
- Don't write a test that just asserts implementation details (e.g. "state variable
  X equals Y") — test observable behavior (what the user sees/can do).

## Definition of done, for any task
A task is not complete until:
1. `tsc --noEmit` passes with zero errors
2. `eslint` passes with zero errors (warnings noted, not necessarily blocking)
3. New/changed logic has tests, and the full test suite passes
4. Loading/empty/error states exist for any new data-driven UI (rule 01)
5. No duplicated types/schemas/queries introduced (rule 03 self-check)
6. No file exceeds ~250 lines without justification (rule 02)

## Git / commits
- Conventional Commits: `feat(tasks): add priority field to task form`,
  `fix(comments): correct 5-minute edit window calculation`,
  `refactor(data): extract shared task include fragment`.
- One logical change per commit. Don't bundle an unrelated refactor into a feature commit.
- Commit messages describe *why*, briefly, if the *what* isn't self-evident from the diff.

## PR description checklist (when opening/summarizing a PR)
- What changed and why (link to PRD section, e.g. "PRD 2.1.3 Labels")
- Schema changes called out explicitly, with migration name
- Screenshots/GIF for any UI change
- Any known follow-up work or explicitly out-of-scope items

## When picking up a task from the PRD
1. Re-read the specific PRD subsection and its Acceptance Criteria before starting.
2. Check off Acceptance Criteria items explicitly in your summary at the end —
   don't just say "done," confirm each listed criterion.
3. If an Acceptance Criterion is ambiguous or conflicts with existing code, flag it
   rather than guessing and moving on.
