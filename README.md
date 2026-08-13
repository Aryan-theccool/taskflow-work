# TaskFlow — Work that flows.

A Trello-style task board for one focused team, built to the TaskFlow assignment spec —
with the board rendered as a **live working app** wrapped in an interactive 3D
(Three.js / React Three Fiber) + **GSAP** experience.

A **Board** holds **Columns** (To Do / In Progress / Done), each Column holds **Tasks**
(title, optional description, Low/Medium/High priority, created date). Everything —
create, edit, delete, move, filter, search — talks to a real Express API backed by a
real SQLite database. Reload the page: the data is exactly where you left it.

![stack](https://img.shields.io/badge/React%2019-61dafb) ![stack](https://img.shields.io/badge/Express-4-green) ![stack](https://img.shields.io/badge/SQLite-node%3Asqlite-blue) ![stack](https://img.shields.io/badge/Three.js-R3F-black) ![stack](https://img.shields.io/badge/GSAP-ScrollTrigger-88ce02)

---

## Quick start (from a clean clone)

**Prereqs:** Node.js **≥ 22.5** (the backend uses the built-in `node:sqlite` driver —
no native modules to compile, no DB server to run) and npm.

```bash
# 1. Backend — API on http://localhost:4000
cd backend
npm install
npm run dev          # creates data/taskflow.db and seeds it on first run

# 2. Frontend — in a second terminal, app on http://localhost:5173
cd frontend
npm install
npm run dev          # Vite proxies /boards and /tasks to the API
```

Open **http://localhost:5173**. Scroll past the 3D hero to the board and start moving tasks.

### One-command variant (single process, production-style)

```bash
cd frontend && npm install && npm run build   # builds frontend/dist
cd ../backend && npm install && npm start      # serves API + built app on :4000
```

### Database utilities

```bash
cd backend
npm run seed          # seed only if empty (first run does this automatically)
npm run seed:force    # wipe everything and reseed the sample board
```

### Tests

```bash
cd backend
npm test
```

Five tests (`node:test`, zero extra deps) covering — at minimum per the brief —
(1) creating a task with no title fails server-side with a 4xx, (2) moving a task
updates its column and persists across a fresh `GET`, and (3) both non-trivial
queries return the right rows against known seed data at the database layer,
plus a guard test for invalid move targets and double-delete 404s.

---

## The database (checked closely, so here it is plainly)

**`backend/schema.sql`** — real keys, real constraints:

- `boards(id PK, name NOT NULL, created_at)`
- `columns(id PK, board_id FK → boards ON DELETE CASCADE, name NOT NULL, position, UNIQUE(board_id, position))`
- `tasks(id PK, column_id FK → columns ON DELETE CASCADE, title NOT NULL CHECK(length(trim(title)) > 0), description NULL, priority CHECK IN ('Low','Medium','High') DEFAULT 'Medium', created_at)`
- Indexes on `tasks(column_id)` and `tasks(priority, created_at DESC)`; `PRAGMA foreign_keys = ON` on every connection.

**Two non-trivial queries** — real SQL in their own modules, exercised by tests,
and rendered live in the frontend's *Insights* section:

- `backend/src/queries/tasksPerColumn.js` — task count per column on a board
  (`LEFT JOIN` + `GROUP BY`), exposed at `GET /boards/:id/stats`.
- `backend/src/queries/tasksByPriority.js` — tasks of a given priority, newest
  first, joined to their column name, exposed at `GET /tasks?priority=High`.

## API surface

| Method | Path | Notes |
|---|---|---|
| `GET` | `/boards/:id` | Board → nested columns → nested tasks |
| `GET` | `/boards/:id/stats` | Tasks per column (query a) |
| `GET` | `/tasks?priority=High&board_id=1` | Priority filter, newest first (query b) |
| `POST` | `/tasks` | `{ title*, description?, priority?, column_id* }` → 400 on empty title or bad column |
| `PUT` | `/tasks/:id` | Update title/description/priority → 404 if missing |
| `PATCH` | `/tasks/:id/move` | `{ column_id }` → 400 on invalid column, 404 if missing |
| `DELETE` | `/tasks/:id` | 204, or 404 "Task not found" on repeat delete |

Every failure returns `{ "error": "…" }` with the right status; the frontend wraps
all calls in one client that turns network errors and non-2xx into visible UI states
(toasts, inline modal errors, a full-screen retry state if the board itself can't load).

## What's on the page

- **Hero** — a pinned, pointer-reactive 3D sculpture of the board itself: three
  glass columns (transmission material, light-former environment, no external HDRIs),
  six floating abstract task-card glyphs colored by priority, sparkline particles
  and an infinite grid floor. GSAP ScrollTrigger scrubs the camera on scroll.
- **Marquee** — infinite GSAP loop.
- **Board** — the full working app: priority filter chips with live counts, title
  search, per-column counts (visible/total while filtering), create/edit modal
  (Esc/backdrop close, inline validation shake), two-step delete, **drag-and-drop
  between lanes** *and* a per-card move menu, optimistic moves with rollback,
  GSAP-animated card entrances and physical 3D tilt on hover.
- **Insights** — the two SQL queries above rendered live with the actual SQL shown.
- Stretch goals included: drag-and-drop, title search, per-column task counts (all
  three, since the core was solid).

## Project layout

```
backend/                 Express + node:sqlite
  schema.sql             the schema, readable on its own
  seed.js                idempotent seed (--force to wipe)
  src/db.js              connection factory (':memory:' for tests)
  src/app.js             app factory (DI db → testable)
  src/server.js          real DB + auto-seed + listen
  src/routes/            boards.js, tasks.js
  src/queries/           tasksPerColumn.js, tasksByPriority.js
  tests/                 tasks.test.js, queries.test.js
frontend/                Vite + React 19 + TS
  src/api/client.ts      one fetch wrapper → readable UI errors
  src/components/        BoardSection, ColumnView, TaskCardView,
                         TaskModal, PriorityFilter chips, Insights, Hero, …
  src/three/             HeroScene (R3F), scrollStore (GSAP↔WebGL bridge)
  src/state/             ToastContext (GSAP-animated notifications)
```

## Assumptions & decisions

- **One board, one implicit team**, per the brief ("no accounts/login"): the app
  operates on board `#1`, which the seed creates. The API still takes real board ids.
- **Cascade deletes**: deleting a column deletes its tasks (a task is meaningless
  outside its column). `ON DELETE CASCADE` encodes it.
- **`node:sqlite` instead of better-sqlite3**: same SQLite engine, but built into
  Node ≥ 22.5 — so `npm install` can never fail on a native compile for the DB,
  and the test suite runs against `:memory:` databases. (Documented since the stack
  doc suggested better-sqlite3; the trade-off is a newer-Node requirement.)
- **Timestamps** are stored as ISO-8601 UTC strings written by the app layer, so
  "newest first" ordering is consistent across seeds and API writes.
- **Priority filtering/search happen client-side** over the fetched board (tiny
  dataset — per the architecture doc); the SQL-level priority query exists
  separately for the Insights panel.
- **Card order within a column** is newest-first by `created_at`; moving a card
  into a column places it at the top of the lane (optimistic UI), then it settles
  into chronological order on next load. Within-column reordering was not in scope.
- **The "visual polish" scope** was deliberately exceeded: the user asked for an
  interactive 3D + GSAP treatment on top of the spec'd functionality. All
  must-haves remain intact and tested underneath.

## With more time

- Column management (rename/add/reorder lanes) and within-column task reordering
  with a persisted `position`.
- WebSocket sync across tabs (explicitly out of scope for v1).
- Auth + per-team boards as sketched in `TaskFlow-3-SECURITY-AND-ACCESS.md`.
- `docker-compose` one-liner.

## Time spent

Roughly a working day: ~40% backend + schema + tests, ~35% board UI/UX and error
handling, ~25% 3D scene + GSAP choreography.

## One thing I learned

`node:sqlite` (`DatabaseSync`) finally makes "real relational DB with zero native
dependencies" practical in Node: the test suite boots isolated in-memory databases
in milliseconds with no ORM and no build step, and `PRAGMA foreign_keys = ON`
plus a `CHECK (length(trim(title)) > 0)` means empty titles are impossible even if
someone bypasses both the form *and* the API route. Also fun: bridging GSAP's
scrubbed ScrollTrigger into the R3F render loop through a plain mutable object
(`scrollStore`) keeps 60fps parallax without a single React re-render.
