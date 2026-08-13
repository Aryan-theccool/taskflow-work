const express = require('express');
const { tasksByPriority } = require('../queries/tasksByPriority');

const PRIORITIES = ['Low', 'Medium', 'High'];

function isValidPriority(p) {
  return typeof p === 'string' && PRIORITIES.includes(p);
}

module.exports = function tasksRouter(db) {
  const router = express.Router();

  const findTask = (id) =>
    db
      .prepare(
        'SELECT id, column_id, title, description, priority, created_at FROM tasks WHERE id = ?'
      )
      .get(id);

  const columnExists = (id) =>
    typeof id === 'number' &&
    Number.isInteger(id) &&
    !!db.prepare('SELECT id FROM columns WHERE id = ?').get(id);

  // GET /tasks?priority=High&board_id=1 — priority filter as a real SQL query
  router.get('/', (req, res, next) => {
    try {
      const { priority, board_id: boardId = 1 } = req.query;
      if (!isValidPriority(priority)) {
        return res
          .status(400)
          .json({ error: 'priority must be one of Low, Medium, High' });
      }
      res.json(tasksByPriority(db, Number(boardId), priority));
    } catch (err) {
      next(err);
    }
  });

  // POST /tasks — create. Title is validated server-side regardless of the form.
  router.post('/', (req, res, next) => {
    try {
      const { title, description = null, priority = 'Medium', column_id } = req.body ?? {};
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
      }
      if (!columnExists(column_id)) {
        return res.status(400).json({ error: 'Invalid column' });
      }
      if (!isValidPriority(priority)) {
        return res
          .status(400)
          .json({ error: 'Invalid priority — use Low, Medium or High' });
      }
      const createdAt = new Date().toISOString();
      const result = db
        .prepare(
          `INSERT INTO tasks (column_id, title, description, priority, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(column_id, title.trim(), description ?? null, priority, createdAt);
      res.status(201).json(findTask(result.lastInsertRowid));
    } catch (err) {
      next(err);
    }
  });

  // PUT /tasks/:id — update title / description / priority
  router.put('/:id', (req, res, next) => {
    try {
      const existing = findTask(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Task not found' });

      const { title, description = null, priority = 'Medium' } = req.body ?? {};
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
      }
      if (!isValidPriority(priority)) {
        return res
          .status(400)
          .json({ error: 'Invalid priority — use Low, Medium or High' });
      }
      db.prepare(
        'UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?'
      ).run(title.trim(), description ?? null, priority, existing.id);
      res.json(findTask(existing.id));
    } catch (err) {
      next(err);
    }
  });

  // PATCH /tasks/:id/move — body { column_id }. Moving to the current column
  // is a harmless no-op that still returns the task.
  router.patch('/:id/move', (req, res, next) => {
    try {
      const existing = findTask(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Task not found' });

      const { column_id } = req.body ?? {};
      if (!columnExists(column_id)) {
        return res.status(400).json({ error: 'Invalid column' });
      }
      db.prepare('UPDATE tasks SET column_id = ? WHERE id = ?').run(
        column_id,
        existing.id
      );
      res.json(findTask(existing.id));
    } catch (err) {
      next(err);
    }
  });

  // DELETE /tasks/:id — 404 if the task is already gone (not a silent no-op)
  router.delete('/:id', (req, res, next) => {
    try {
      const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
};
