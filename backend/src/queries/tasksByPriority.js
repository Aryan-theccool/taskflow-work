/**
 * Non-trivial query (b): tasks with a given priority, newest first,
 * joined across the board so results carry their column name.
 * Runs as real SQL — the DB does the filtering and ordering.
 */
const TASKS_BY_PRIORITY_SQL = `
  SELECT t.id, t.title, t.description, t.priority, t.created_at,
         t.column_id, c.name AS column_name
  FROM tasks t
  JOIN columns c ON c.id = t.column_id
  WHERE c.board_id = ? AND t.priority = ?
  ORDER BY t.created_at DESC, t.id DESC
`;

function tasksByPriority(db, boardId, priority) {
  return db.prepare(TASKS_BY_PRIORITY_SQL).all(boardId, priority);
}

module.exports = { tasksByPriority, TASKS_BY_PRIORITY_SQL };
