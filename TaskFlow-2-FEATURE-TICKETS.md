# Feature Ticket List — TaskFlow

Each ticket is written to be usable directly as a prompt for an AI coding tool.

---

### TICKET-01: Database schema + seed data
**Priority:** Must-have
**Depends on:** none
**Description:** Design a SQLite (or Postgres/MySQL) schema with three tables — `boards`,
`columns`, `tasks` — with proper primary keys, a foreign key from `tasks.column_id →
columns.id` and `columns.board_id → boards.id`, `NOT NULL` on `title`, and sensible types
(priority as a constrained text/enum, `created_at` as a timestamp). Include a seed script that
creates one board with three columns and a handful of sample tasks.
**Acceptance criteria:**
- `schema.sql` (or migration files) is present and readable on its own.
- Every table has a primary key; foreign keys are enforced (`PRAGMA foreign_keys = ON` if
  SQLite).
- Fresh DB is non-empty after running the seed script.

---

### TICKET-02: Task CRUD API
**Priority:** Must-have
**Depends on:** TICKET-01
**Description:** Backend endpoints: `GET /boards/:id` (board with columns+tasks),
`POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`, `PATCH /tasks/:id/move` (updates
`column_id`). Reject task creation with an empty/missing title server-side, independent of
frontend validation.
**Acceptance criteria:**
- Creating a task with an empty title returns a 4xx error, not a 500 or silent success.
- Moving a task updates `column_id` and is reflected on next `GET`.
- Deleting a task removes it and it no longer appears on reload.

---

### TICKET-03: Board view (frontend)
**Priority:** Must-have
**Depends on:** TICKET-02
**Description:** React component rendering the board — columns as lanes, tasks as cards
showing title, priority, and truncated description. Fetches from `GET /boards/:id` on load.
**Acceptance criteria:** Board renders columns and tasks correctly; reloading the page shows
the same data (confirms persistence, not local state).

---

### TICKET-04: Create/edit/delete task UI
**Priority:** Must-have
**Depends on:** TICKET-03
**Description:** A form (modal or inline) to create a task, an edit view for existing tasks,
and a delete action with confirmation. Client-side validation blocks empty titles before
submit; server errors are surfaced if the API rejects the request anyway.
**Acceptance criteria:** Can create, edit, and delete a task entirely from the UI; empty title
is blocked in the form and shows a message if somehow submitted anyway.

---

### TICKET-05: Move task (dropdown or drag-and-drop)
**Priority:** Must-have
**Depends on:** TICKET-02, TICKET-03
**Description:** A control on each task card to change its column — a `<select>` of column
names is enough; drag-and-drop is a stretch, not a requirement. Calls the move endpoint and
updates the board.
**Acceptance criteria:** Selecting a new column moves the task and it persists on reload.
Working dropdown takes priority over a half-working drag-and-drop.

---

### TICKET-06: Priority filter
**Priority:** Must-have
**Depends on:** TICKET-03
**Description:** A filter control (buttons or a select) that shows only tasks of the selected
priority across all columns, client-side over the already-fetched board data.
**Acceptance criteria:** Selecting "High" hides Low/Medium tasks across every column; "All"
clears the filter.

---

### TICKET-07: Error handling for failed requests
**Priority:** Must-have
**Depends on:** TICKET-02, TICKET-04
**Description:** Wrap API calls so a failed request (network error or non-2xx) shows a visible
message in the UI instead of a blank screen or console-only error.
**Acceptance criteria:** Simulating a failed request (e.g. stop the backend) shows a readable
error state, not a white screen.

---

### TICKET-08: Backend tests
**Priority:** Must-have
**Depends on:** TICKET-01, TICKET-02
**Description:** Tests covering: (1) creating a task with no title fails, (2) moving a task
updates its column correctly, (3) a direct database-layer test on one of the two required
non-trivial queries (tasks per column, or tasks by priority newest-first).
**Acceptance criteria:** All three tests exist, run, and pass against seeded data.

---

### TICKET-09: Two non-trivial DB queries
**Priority:** Must-have
**Depends on:** TICKET-01
**Description:** Implement and show the actual SQL (or query-builder code) for: (a) count of
tasks per column on a board, (b) tasks with a given priority, newest first. Must run as real
queries against the DB, not fetch-everything-then-filter-in-code.
**Acceptance criteria:** Both queries are visible in the codebase as real SQL/query-builder
calls, and are exercised by at least one test (see TICKET-08).

---

### TICKET-10: Search by title (stretch — pick at most one stretch)
**Priority:** Nice-to-have
**Depends on:** TICKET-03
**Description:** A text input that filters visible tasks by title substring match.
**Acceptance criteria:** Typing a query narrows visible tasks to title matches; clearing it
restores the full board.

---

### TICKET-11: Deployment + README
**Priority:** Must-have (deployment gives priority per brief, but not required)
**Depends on:** all above
**Description:** README with clean-clone setup instructions (install + run frontend and
backend), a short section on assumptions made, what you'd add with more time, time spent, and
one thing learned while building it. Deploy if time allows (Render/Railway/Vercel/Fly).
**Acceptance criteria:** Someone can clone, follow the README exactly, and get a working app
with seeded data.
