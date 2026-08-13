const express = require('express');
const { tasksPerColumn } = require('../queries/tasksPerColumn');

module.exports = function boardsRouter(db) {
  const router = express.Router();

  // GET /boards/:id/stats — tasks per column (kept before /:id so it isn't
  // swallowed by the id param route)
  router.get('/:id/stats', (req, res, next) => {
    try {
      const board = db
        .prepare('SELECT id FROM boards WHERE id = ?')
        .get(req.params.id);
      if (!board) return res.status(404).json({ error: 'Board not found' });
      res.json(tasksPerColumn(db, board.id));
    } catch (err) {
      next(err);
    }
  });

  // GET /boards/:id — board with nested columns and their tasks
  router.get('/:id', (req, res, next) => {
    try {
      const board = db
        .prepare('SELECT id, name FROM boards WHERE id = ?')
        .get(req.params.id);
      if (!board) return res.status(404).json({ error: 'Board not found' });

      const columns = db
        .prepare(
          'SELECT id, board_id, name, position FROM columns WHERE board_id = ? ORDER BY position ASC'
        )
        .all(board.id);
      const taskStmt = db.prepare(
        `SELECT id, column_id, title, description, priority, created_at
         FROM tasks WHERE column_id = ?
         ORDER BY created_at DESC, id DESC`
      );
      for (const column of columns) column.tasks = taskStmt.all(column.id);

      res.json({ ...board, columns });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
