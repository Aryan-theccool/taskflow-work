# Technical Architecture Document — TaskFlow

## Stack and reasoning
- **React (JS or TS)** — required by the brief. TypeScript recommended even though optional —
  catches shape mismatches between the API response and what the board component expects,
  cheap insurance for a 3-day build.
- **Node.js (Express) or Python (FastAPI/Flask)** — either satisfies the brief; Express is a
  fast choice if the frontend is also JS/TS, keeping one language across the stack.
- **SQLite** — explicitly called out as completely fine and avoids running a separate DB
  server for a 3-day assignment; a real schema with keys/constraints matters more here than
  which relational engine it is. Swappable for Postgres/MySQL later since the schema is plain
  SQL either way.
- **No ORM magic-methods-only approach** — the brief specifically wants to see real SQL for
  the two non-trivial queries, so raw SQL (or a query builder like Knex/SQLAlchemy Core,
  not just ORM `.findAll()`) is used for those two queries specifically.

## Folder structure
```
taskflow/
├── README.md
├── backend/
│   ├── package.json (or requirements.txt)
│   ├── schema.sql
│   ├── seed.js / seed.py
│   ├── src/
│   │   ├── db.js            (connection/init)
│   │   ├── routes/
│   │   │   ├── boards.js
│   │   │   └── tasks.js
│   │   ├── queries/
│   │   │   ├── tasksPerColumn.js
│   │   │   └── tasksByPriority.js
│   │   └── server.js
│   └── tests/
│       ├── tasks.test.js
│       └── queries.test.js
└── frontend/
    ├── package.json
    ├── src/
    │   ├── App.tsx
    │   ├── api/
    │   │   └── client.ts
    │   ├── components/
    │   │   ├── Board.tsx
    │   │   ├── Column.tsx
    │   │   ├── TaskCard.tsx
    │   │   ├── TaskForm.tsx
    │   │   └── PriorityFilter.tsx
    │   └── styles/
    └── public/
```

## Database schema (plain English)
- **boards** — `id`, `name`. One row for the single board in scope.
- **columns** — `id`, `board_id` (FK → boards), `name`, `position` (for ordering To
  Do/In Progress/Done left to right).
- **tasks** — `id`, `column_id` (FK → columns), `title` (NOT NULL), `description` (nullable),
  `priority` (constrained to Low/Medium/High), `created_at` (timestamp, default now).

Relationships: a board has many columns; a column has many tasks; deleting a column should
either cascade-delete its tasks or be blocked if non-empty (pick one, document it as an
assumption).

## Environment variables
| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` or `DB_PATH` | backend | SQLite file path, or connection string if using Postgres/MySQL instead |
| `PORT` | backend | Port the API listens on |
| `VITE_API_URL` / `NEXT_PUBLIC_API_URL` | frontend | Base URL the frontend calls |

## Notes before building
- Priority filtering happens client-side over the already-fetched board (small dataset, no
  need for server-side filtering here — unlike a 10k-row dataset, this doesn't need pagination).
- The two required non-trivial queries belong in their own module (`queries/`), not inline in
  route handlers, so they're easy to point to and to unit-test directly against the DB layer.
- Keep seed data small but non-trivial (a handful of tasks across all three priorities and all
  columns) so the "tasks per column" and "tasks by priority" queries have something real to
  return in tests.
