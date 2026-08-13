/**
 * Seed script — creates one board with three columns and a handful of tasks
 * spanning every priority and column, so the "tasks per column" and
 * "tasks by priority, newest first" queries have real data to return.
 *
 * Usage:
 *   node seed.js           seeds only if the DB has no boards (idempotent)
 *   node seed.js --force   wipes all data and reseeds from scratch
 */
const { createDb, DEFAULT_DB_PATH } = require('./src/db');

// [column index, title, description, priority, age in days]
const SEED_TASKS = [
  [0, 'Design the empty-board state', 'What a column looks like with zero tasks — intentional, not broken.', 'Low', 9],
  [0, 'Write API client error wrapper', 'Every fetch goes through one wrapper that surfaces failures to the UI.', 'High', 8],
  [0, 'Sketch drag-and-drop interactions', null, 'Low', 7],
  [0, 'Dark glassmorphism visual pass', 'Frosted columns, glowing priority tags, soft shadows.', 'Medium', 6],
  [1, 'Build task CRUD endpoints', 'POST / PUT / DELETE plus PATCH /tasks/:id/move, title validated server-side.', 'High', 5],
  [1, 'Choreograph GSAP scroll scenes', 'Pinned hero, marquee loop, staggered column reveals.', 'Medium', 4],
  [1, 'Model floating 3D task cards', 'React Three Fiber sculpture with parallax camera and glass panels.', 'High', 3],
  [2, 'Design SQLite schema', 'boards / columns / tasks with real keys, checks and indexes.', 'High', 7],
  [2, 'Seed script with sample board', null, 'Medium', 2],
  [2, 'Backend tests: validation, move, queries', 'node:test against an in-memory seeded database.', 'Medium', 1],
];

function isEmpty(db) {
  const row = db.prepare('SELECT COUNT(*) AS n FROM boards').get();
  return row.n === 0;
}

function seedDatabase(db) {
  const insertBoard = db.prepare('INSERT INTO boards (name) VALUES (?)');
  const insertColumn = db.prepare(
    'INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)'
  );
  const insertTask = db.prepare(
    `INSERT INTO tasks (column_id, title, description, priority, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  // One explicit transaction keeps seeding atomic without any driver magic.
  db.exec('BEGIN');
  try {
    const boardId = insertBoard.run('Team Board').lastInsertRowid;
    const columnIds = ['To Do', 'In Progress', 'Done'].map(
      (name, position) => insertColumn.run(boardId, name, position).lastInsertRowid
    );
    for (const [colIdx, title, description, priority, ageDays] of SEED_TASKS) {
      const createdAt = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000).toISOString();
      insertTask.run(columnIds[colIdx], title, description, priority, createdAt);
    }
    db.exec('COMMIT');
    return { boardId, columnIds };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  const db = createDb(process.env.DB_PATH || DEFAULT_DB_PATH);
  if (force) {
    db.exec('DELETE FROM tasks; DELETE FROM columns; DELETE FROM boards;');
  }
  if (isEmpty(db)) {
    const { boardId } = seedDatabase(db);
    console.log(`Seeded board #${boardId}: 3 columns, ${SEED_TASKS.length} tasks.`);
  } else {
    console.log('Database already contains a board — nothing to do. Use --force to reseed.');
  }
  db.close();
}

module.exports = { seedDatabase, isEmpty, SEED_TASKS };
