const test = require('node:test');
const assert = require('node:assert/strict');
const { createDb } = require('../src/db');
const { seedDatabase, SEED_TASKS } = require('../seed');
const { tasksPerColumn } = require('../src/queries/tasksPerColumn');
const { tasksByPriority } = require('../src/queries/tasksByPriority');

test('tasksPerColumn returns the right count per column for the seed data', (t) => {
  const db = createDb(':memory:');
  t.after(() => db.close());
  seedDatabase(db);

  const rows = tasksPerColumn(db, 1);
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((r) => r.column_name),
    ['To Do', 'In Progress', 'Done']
  );

  const expected = [0, 0, 0];
  for (const [colIdx] of SEED_TASKS) expected[colIdx] += 1;
  assert.deepEqual(rows.map((r) => r.task_count), expected);
  assert.equal(
    rows.reduce((sum, r) => sum + r.task_count, 0),
    SEED_TASKS.length,
    'counts across columns must add up to every seeded task'
  );
});

test('tasksByPriority returns only that priority, newest first', (t) => {
  const db = createDb(':memory:');
  t.after(() => db.close());
  seedDatabase(db);

  const highs = tasksByPriority(db, 1, 'High');
  const expectedHighs = SEED_TASKS.filter((s) => s[3] === 'High').length;
  assert.equal(highs.length, expectedHighs);
  assert.ok(highs.every((r) => r.priority === 'High'));

  const stamps = highs.map((r) => r.created_at);
  const sorted = [...stamps].sort().reverse();
  assert.deepEqual(stamps, sorted, 'results must be ordered newest first');

  // A column name comes along for the ride thanks to the JOIN
  assert.ok(highs.every((r) => typeof r.column_name === 'string'));
});
