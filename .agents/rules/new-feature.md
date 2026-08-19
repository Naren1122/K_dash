# Workflow: /new-feature

Invoke with `/new-feature <name>`. Use this whenever starting a new PRD feature
(e.g. Labels, Comments, Notifications) from scratch.

## Steps

1. **Read context**
   - Read `AGENTS.md`.
   - Read the relevant PRD section and its Acceptance Criteria in full.
   - Read all files in `.agents/rules/`.

2. **Survey existing patterns**
   - Find the most similar existing feature folder under `src/features/`.
   - Note its structure (actions/, components/, schema.ts, etc.) — the new feature
     should mirror it unless there's a specific reason not to.

3. **Plan (present before coding)**
   - List: Prisma schema changes (if any), new files to create, files to modify.
   - Flag any schema change explicitly and wait for confirmation before migrating.

4. **Schema + data layer**
   - Update `schema.prisma` if needed → `prisma migrate dev`.
   - Add `lib/data/<model>.data.ts` with the needed query functions.

5. **Validation + types**
   - Add `features/<name>/schema.ts` (Zod) — this is the only validation source
     (rule 03).
   - Derive types from Prisma/Zod, don't hand-write duplicates.

6. **Server Actions**
   - One file per action in `features/<name>/actions/`, following the pattern in
     `05-data-layer-and-api.md`.

7. **UI**
   - Reuse `components/ui/` primitives (rule 01).
   - Build components in `features/<name>/components/`.
   - Cover loading/empty/error states explicitly.

8. **Tests**
   - Unit tests for utils/data layer, integration tests for actions.

9. **Self-check against rules**
   - Run the red-flag checklist in `03-dry-and-data-duplication.md` §7.
   - Confirm every Definition of Done item in `06-testing-git-workflow.md`.

10. **Summarize**
    - List PRD Acceptance Criteria and confirm each is met.
    - Note any assumptions made or scope explicitly deferred.
