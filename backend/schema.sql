-- TaskFlow database schema
-- One board holds many columns; each column holds many tasks.
-- Deleting a board or column cascade-deletes its children (documented assumption:
-- a column's tasks have no meaning outside the column).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS boards (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL CHECK (length(trim(name)) > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS columns (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id  INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name      TEXT NOT NULL CHECK (length(trim(name)) > 0),
  position  INTEGER NOT NULL,               -- left-to-right ordering of lanes
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (board_id, position)
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id   INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,                          -- optional by design
  priority    TEXT NOT NULL DEFAULT 'Medium'
              CHECK (priority IN ('Low', 'Medium', 'High')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- The board view is "all tasks grouped by column" and the priority query
-- filters by priority, so both lookup paths are indexed.
CREATE INDEX IF NOT EXISTS idx_tasks_column   ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority, created_at DESC);
