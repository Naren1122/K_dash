# Rule: UI / UX Standards

## Design system first
- Before building any new UI element, check `src/components/ui/` for an existing
  primitive (Button, Badge, Input, Select, Dialog, Dropdown, Tooltip, etc.).
  **Reuse it. Do not create a one-off styled `<div>` that duplicates an existing primitive.**
- If no primitive exists and you'll need it more than once, build it in
  `src/components/ui/` first, then consume it — don't inline the styling in the
  feature component.
- Colors, spacing, radii, and shadows come from Tailwind theme tokens
  (`tailwind.config.ts`) — never hardcode hex values or arbitrary px in `className`.
  Example: use `bg-priority-high` not `bg-[#f97316]`.

## Consistency rules specific to this project
- **Priority badges**: one shared `<PriorityBadge priority={...} />` component.
  Colors: LOW=gray, MEDIUM=yellow, HIGH=orange, CRITICAL=red. Defined once in
  `src/features/tasks/constants.ts`, imported everywhere — never re-declare the
  color map in another file.
- **Label pills**: one shared `<LabelPill label={...} />`. Same rule.
- **Due date badges**: overdue=red, due-within-48h=yellow, otherwise neutral. The
  logic for "is this overdue/upcoming" lives in ONE utility function
  (`src/features/tasks/utils/dueDate.ts`), never recomputed inline in a component.

## Required states for every view/component that fetches or mutates data
Every component that reads or writes data must explicitly handle:
1. **Loading** — skeleton or spinner, not a blank screen
2. **Empty** — a real empty state with a next action (e.g. "No tasks yet — Create one"),
   not just an empty list
3. **Error** — a visible, human-readable error with a retry option, not a silent failure
4. **Success/optimistic** — for mutations (drag-and-drop, comments), update the UI
   immediately, then reconcile or roll back on server error with a toast

## Accessibility (non-negotiable, not a stretch goal)
- All interactive elements must be reachable and operable by keyboard alone.
- Drag-and-drop (dnd-kit) must have a keyboard equivalent (arrow keys + Enter/Space
  per PRD 2.2.1) — this is a hard requirement, not optional polish.
- Every icon-only button has an `aria-label`.
- Color is never the only signal (e.g. priority/overdue badges also carry text/label,
  not just color, for colorblind users).
- Modals/drawers (TaskDetail, NotificationDrawer) trap focus and close on Escape.

## Responsiveness
- Design mobile-first for every new component; verify at 375px, 768px, 1280px.
- The Kanban board must degrade to a scrollable single-column or List view on mobile
  — never a horizontally-clipped board with no way to scroll.

## Forms
- Every form field has a visible label (not placeholder-only).
- Validation errors appear inline, next to the field, in plain language — not a
  generic toast for the whole form.
- Client-side validation schema must be the *same* Zod schema used server-side
  (see `03-dry-and-data-duplication.md`) — never write two different validation rules.

## When in doubt
If a design decision isn't specified in the PRD, pick the option consistent with
the existing board UI and state the assumption in your summary — don't silently
invent a new visual language for one feature.
