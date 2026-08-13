/**
 * Non-trivial query (a): count of tasks per column on a board.
 * Runs as real SQL with a GROUP BY — not "fetch everything, count in code".
 */
const TASKS_PER_COLUMN_SQL = `
  SELECT c.id          AS column_id,
         c.name        AS column_name,
         c.position    AS position,
         COUNT(t.id)   AS task_count
  FROM columns c
  LEFT JOIN tasks t ON t.column_id = c.id
  WHERE c.board_id = ?
  GROUP BY c.id, c.name, c.position
  ORDER BY c.position ASC
`;

function tasksPerColumn(db, boardId) {
  return db.prepare(TASKS_PER_COLUMN_SQL).all(boardId);
}

module.exports = { tasksPerColumn, TASKS_PER_COLUMN_SQL };
