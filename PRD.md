# Product Requirements Document: Kanban Task Board Enhancements

## 1. Product Overview

### 1.1 Vision
Transform the current Kanban board into a production-ready project management tool that supports team collaboration, workflow customization, and data-driven insights.

### 1.2 Current State
- Basic 3-column board (To Do, In Progress, Done)
- Role-based access (Admin/Member)
- Task CRUD with status updates and reassignment
- Auth.js credentials authentication
- PostgreSQL + Prisma + Next.js App Router

### 1.3 Target Users
- **Admins**: Project managers, team leads - full board control
- **Members**: Developers, designers, contributors - assigned task execution
- **Stakeholders**: View-only access to progress (future)

---

## 2. Feature Specifications

### 2.1 Phase 1: Core Task Enhancements (High Priority)

#### 2.1.1 Task Priorities
| Requirement | Details |
|-------------|---------|
| **Priority Levels** | Low, Medium, High, Critical |
| **Visual Indicators** | Color-coded badges, sort ordering |
| **Default** | Medium |
| **Admin Controls** | Can set/change any task priority |
| **Member Controls** | View only |

**Acceptance Criteria:**
- Priority field added to Task model
- Dropdown in create/edit task form (Admin only)
- Visual badge on task cards (colored: gray/yellow/orange/red)
- Tasks sortable by priority within columns
- API validation: only valid enum values accepted

#### 2.1.2 Due Dates
| Requirement | Details |
|-------------|---------|
| **Date Picker** | Native HTML date input + calendar UI |
| **Timezone** | Store UTC, display in user's local timezone |
| **Overdue Highlighting** | Red badge, sort to top |
| **Upcoming** | Yellow badge for due within 48h |
| **Filtering** | Filter by: overdue, this week, this month, no date |

**Acceptance Criteria:**
- `dueDate` DateTime? field on Task model
- Date picker in create/edit form
- Overdue/upcoming badges on task cards
- Sort by due date option
- Calendar view page showing tasks by date

#### 2.1.3 Labels/Tags
| Requirement | Details |
|-------------|---------|
| **System Labels** | Pre-defined: bug, feature, docs, chore, design |
| **Custom Labels** | Admin can create/edit/delete labels |
| **Colors** | 10 preset colors per label |
| **Multi-select** | Tasks can have multiple labels |
| **Filtering** | Filter board by one or more labels |

**Acceptance Criteria:**
- Label model: id, name, color, workspaceId
- TaskLabel join table (many-to-many)
- Label picker in task form (multi-select)
- Colored pills on task cards
- Label filter in board header

#### 2.1.4 Task Comments
| Requirement | Details |
|-------------|---------|
| **Threaded** | Flat list, chronological |
| **Markdown** | Basic support (bold, italic, code, links) |
| **Mentions** | @username triggers notification |
| **Edit/Delete** | Author can edit (5min window), Admin can delete any |
| **Real-time** | New comments appear without refresh |

**Acceptance Criteria:**
- Comment model: id, content, taskId, authorId, createdAt, updatedAt
- Comment section in task detail view
- Markdown rendering (sanitized)
- @mention autocomplete
- Optimistic UI updates

### 2.2 Phase 2: Board & View Enhancements (Medium Priority)

#### 2.2.1 Drag-and-Drop
| Requirement | Details |
|-------------|---------|
| **Library** | @dnd-kit (accessible, lightweight) |
| **Operations** | Move between columns, reorder within column |
| **Touch Support** | Mobile-friendly |
| **Keyboard** | Arrow keys + Enter/Space for accessibility |
| **Optimistic** | Immediate visual feedback, rollback on error |

**Acceptance Criteria:**
- Drag tasks between columns
- Reorder within column
- Status updates via Server Action on drop
- Loading state during mutation
- Error toast on failure with auto-revert

#### 2.2.2 Custom Columns (Workflow)
| Requirement | Details |
|-------------|---------|
| **Default** | To Do, In Progress, Done |
| **Customizable** | Admin can add/remove/reorder columns |
| **Per Board** | Each board has own workflow |
| **Status Mapping** | Each column maps to TaskStatus enum |
| **WIP Limits** | Optional max tasks per column |

**Acceptance Criteria:**
- Column model: id, name, position, status, boardId, wipLimit
- Admin settings page for column management
- Board renders dynamic columns
- WIP limit warning (not blocking)

#### 2.2.3 Multiple Views
| View | Description |
|------|-------------|
| **Kanban** | Current column-based board |
| **List** | Table with sortable columns |
| **Calendar** | Monthly view with tasks on due dates |
| **Timeline** | Gantt-like view (stretch) |

**Acceptance Criteria:**
- View switcher in header
- Persisted preference per user
- Each view shares same filters
- Responsive on all viewports

### 2.3 Phase 3: Collaboration & Notifications (Medium Priority)

#### 2.3.1 Notifications
| Requirement | Details |
|-------------|---------|
| **Types** | Task assigned, status changed, commented, mentioned, due soon |
| **Channels** | In-app (bell icon), Email (configurable) |
| **Preferences** | Per-user, per-event-type toggles |
| **Digest** | Daily summary email option |
| **Mark Read** | Individual + mark all read |

**Acceptance Criteria:**
- Notification model: id, userId, type, payload, readAt
- Bell icon with badge count
- Notification center drawer
- Email templates (React Email)
- Preference page

#### 2.3.2 Activity Log
| Requirement | Details |
|-------------|---------|
| **Events** | Created, updated (field-level), deleted, commented, reassigned |
| **Retention** | 90 days default, configurable |
| **Display** | Chronological feed on task detail |
| **Filter** | By event type, user, date range |

**Acceptance Criteria:**
- ActivityLog model: id, taskId, userId, action, field, oldValue, newValue, createdAt
- Auto-log on all mutations
- Activity tab in task detail
- Pagination (infinite scroll)

### 2.4 Phase 4: Analytics & Reporting (Low Priority)

#### 2.4.1 Metrics Dashboard
| Metric | Description |
|--------|-------------|
| **Throughput** | Tasks completed per week |
| **Cycle Time** | Avg time from In Progress → Done |
| **Lead Time** | Avg time from Created → Done |
| **WIP** | Current work in progress |
| **Burndown** | Sprint burndown chart |

**Acceptance Criteria:**
- Dashboard page (Admin only)
- Charts using Recharts/Tremor
- Date range picker
- Export PNG/CSV

#### 2.4.2 Reports
| Report | Format |
|--------|--------|
| **Sprint Report** | PDF summary |
| **Team Velocity** | CSV export |
| **Individual Contribution** | CSV export |

---

## 3. Technical Architecture

### 3.1 Database Schema Extensions

```prisma
// New models for Phase 1
model Label {
  id        String   @id @default(cuid())
  name      String
  color     String   // hex
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks     TaskLabel[]
  @@unique([name, boardId])
}

model TaskLabel {
  taskId   String
  labelId  String
  task     Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label    Label  @relation(fields: [labelId], references: [id], onDelete: Cascade)
  @@id([taskId, labelId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ActivityLog {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String   // CREATED, UPDATED, DELETED, COMMENTED, REASSIGNED
  field     String?  // e.g., "status", "assigneeId", "title"
  oldValue  String?  @db.Text
  newValue  String?  @db.Text
  createdAt DateTime @default(now())
  @@index([taskId])
  @@index([userId])
  @@index([createdAt])
}

// Extended Task model
model Task {
  // ... existing fields
  dueDate      DateTime?
  priority     Priority   @default(MEDIUM)
  labels       TaskLabel[]
  comments     Comment[]
  activities   ActivityLog[]
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// Phase 2: Board & Columns
model Board {
  id        String   @id @default(cuid())
  name      String
  key       String   // short code like "ENG", "DES"
  columns   Column[]
  labels    Label[]
  members   BoardMember[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([key])
}

model Column {
  id        String   @id @default(cuid())
  name      String
  position  Int
  status    TaskStatus
  wipLimit  Int?
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  @@unique([boardId, position])
}

model BoardMember {
  id        String   @id @default(cuid())
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      BoardRole @default(MEMBER)
  @@unique([boardId, userId])
}

enum BoardRole {
  ADMIN
  MEMBER
  VIEWER
}

// Phase 3: Notifications
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  payload   Json     // { taskId, taskTitle, actorId, actorName, ... }
  readAt    DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt])
  @@index([createdAt])
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_STATUS_CHANGED
  TASK_COMMENTED
  TASK_MENTIONED
  TASK_DUE_SOON
  TASK_OVERDUE
}
```

### 3.2 API Layer (Server Actions)

```
src/app/actions/
├── tasks.ts           # Existing + priority, dueDate, labels
├── comments.ts        # createComment, updateComment, deleteComment, getComments
├── labels.ts          # createLabel, updateLabel, deleteLabel, getLabels
├── boards.ts          # createBoard, updateBoard, getBoard, getBoards
├── columns.ts         # createColumn, updateColumn, reorderColumns, deleteColumn
├── notifications.ts   # getNotifications, markRead, markAllRead, updatePreferences
├── activity.ts        # getActivityLog (internal)
└── analytics.ts       # getMetrics, exportReport (Admin only)
```

### 3.3 UI Components

```
src/components/
├── board/
│   ├── Board.tsx              # Main board with view switcher
│   ├── Column.tsx             # Droppable column
│   ├── TaskCard.tsx           # Draggable task card
│   ├── TaskDetail.tsx         # Modal/sheet with comments, activity
│   ├── CreateTaskForm.tsx     # Enhanced with priority, dueDate, labels
│   └── LabelFilter.tsx        # Multi-select label filter
├── views/
│   ├── KanbanView.tsx
│   ├── ListView.tsx
│   ├── CalendarView.tsx
│   └── TimelineView.tsx       # Stretch
├── labels/
│   ├── LabelPicker.tsx
│   ├── LabelManager.tsx       # Admin settings
│   └── LabelPill.tsx
├── comments/
│   ├── CommentList.tsx
│   ├── CommentForm.tsx
│   └── MentionAutocomplete.tsx
├── notifications/
│   ├── NotificationBell.tsx
│   ├── NotificationDrawer.tsx
│   └── NotificationPreferences.tsx
├── analytics/
│   ├── MetricsDashboard.tsx
│   ├── ThroughputChart.tsx
│   ├── CycleTimeChart.tsx
│   └── ExportButtons.tsx
└── settings/
    ├── BoardSettings.tsx
    ├── ColumnManager.tsx
    └── WorkflowEditor.tsx
```

---

## 4. Implementation Priority & Timeline

### Sprint 1 (Week 1-2): Core Task Enhancements
- [ ] Add Priority, DueDate, Labels to Prisma schema
- [ ] Create migrations and seed data
- [ ] Update Task create/update Server Actions
- [ ] Build Label CRUD actions + UI
- [ ] Add priority badge, due date picker, label pills to TaskCard
- [ ] Implement Comment model + actions + UI

### Sprint 2 (Week 3-4): Drag-and-Drop + Custom Columns
- [ ] Install @dnd-kit
- [ ] Implement drag-and-drop in KanbanView
- [ ] Create Column model + Board model
- [ ] Build ColumnManager admin UI
- [ ] Add view switcher (Kanban/List)

### Sprint 3 (Week 5-6): Notifications + Activity
- [ ] Notification model + actions
- [ ] In-app notification bell + drawer
- [ ] Email notifications (React Email + Resend/SendGrid)
- [ ] ActivityLog auto-logging on all mutations
- [ ] Activity tab in TaskDetail

### Sprint 4 (Week 7-8): Analytics + Polish
- [ ] MetricsDashboard with charts
- [ ] CalendarView
- [x] Task pagination (3 tasks per page)
- [x] Dark mode (System / Light / Dark theme switcher)
- [ ] Keyboard shortcuts
- [ ] Command palette (Cmd+K)
- [ ] Comprehensive testing

---

## 5. Success Metrics

| Metric | Target |
|--------|--------|
| Task creation time | < 30 seconds |
| Board load time (100 tasks) | < 1.5s |
| Drag-and-drop latency | < 100ms perceived |
| Comment real-time delay | < 500ms |
| Notification delivery | < 5s |
| Test coverage | > 80% |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 95 |

---

## 6. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Drag-and-drop accessibility issues | Medium | High | Use @dnd-kit (a11y-first), test with screen readers |
| Real-time complexity | Medium | Medium | Start with polling/SSE, upgrade to WebSockets later |
| Schema migration complexity | Low | High | Plan migrations carefully, test on staging |
| Notification spam | Medium | Medium | Granular preferences, digest options |
| Performance with large boards | Medium | High | Virtualize lists, paginate, optimize queries |

---

## 7. Out of Scope (v1)

- Mobile native apps
- GitHub/GitLab/Jira integrations
- Time tracking
- Custom fields (beyond labels)
- Advanced permissions (beyond BoardRole)
- Public/guest boards
- Webhooks API
- AI-powered features

---

## 8. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Engineering Lead | | | |
| Design Lead | | | |

---

*Document Version: 1.0*
*Last Updated: 2026-08-18*
*Next Review: Sprint 1 Planning*