# Frontend Specification Document — TaskFlow

The brief is explicit that this isn't a design evaluation — "plain but functional" is fine.
This spec is kept intentionally light so time goes into the working board, not pixel-polish.

## Design system

### Color palette
| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#f5f6f8` | Page background |
| `--color-surface` | `#ffffff` | Columns, task cards |
| `--color-border` | `#e2e4e9` | Card/column borders |
| `--color-text-primary` | `#1f2430` | Titles, body text |
| `--color-text-secondary` | `#6b7280` | Meta text (created date, description preview) |
| `--color-accent` | `#4f6df5` | Primary buttons, active filter |
| `--color-priority-low` | `#9ca3af` | Low priority tag |
| `--color-priority-medium` | `#f59e0b` | Medium priority tag |
| `--color-priority-high` | `#ef4444` | High priority tag |

### Typography
- System font stack (`-apple-system, Segoe UI, Roboto, sans-serif`) — no custom font loading
  needed for a functional, not visual, evaluation.
- Sizes: 13px (meta), 14px (body/card text), 16px (column headers), 20px (board title).

### Spacing
4px base scale: 4 / 8 / 12 / 16 / 24px. Card internal padding 12px; gap between cards 8px;
gap between columns 16px.

### Component styles
- **Button:** accent background for primary (Create Task, Save), plain bordered for secondary
  (Cancel), 6px radius.
- **Input/textarea:** bordered, 6px radius, red border + inline message on validation failure
  (empty title).
- **Card (task):** white surface, 1px border, small shadow on hover, priority shown as a small
  colored tag/dot rather than a full-color card background (keeps it scannable).
- **Modal (create/edit task):** simple centered modal, backdrop click or Escape closes it — a
  library (or a plain hand-built one) is fine either way, this isn't the constrained component
  like TaskFlow's board itself.

### Layout rules
- Columns laid out horizontally, each a fixed-ish width (~280px), horizontally scrollable if
  they overflow the viewport rather than wrapping.
- Column header shows name (+ optional task count if built as the stretch goal).
- Mobile: stacking columns vertically is acceptable — the brief doesn't require the 360px-wide
  polish that a denser dashboard would.

## API / integration spec

No third-party services in scope — this is a self-contained board backed by its own database.
No payment, auth, or notification providers are called anywhere.

Internal API surface:
- `GET /boards/:id` — board with nested columns and tasks
- `POST /tasks` — create, body `{ title, description?, priority?, column_id }`
- `PUT /tasks/:id` — update title/description/priority
- `PATCH /tasks/:id/move` — body `{ column_id }`
- `DELETE /tasks/:id` — delete

Each returns a clear error body (`{ error: "..." }`) with an appropriate status code on
failure, which the frontend surfaces per `3-SECURITY-AND-ACCESS.md`'s error handling table.
