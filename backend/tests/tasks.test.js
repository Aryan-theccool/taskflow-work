const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, getBoard } = require('./helpers');

test('creating a task with no title is rejected server-side (400, not 500)', async (t) => {
  const { base } = startTestServer(t);

  for (const badBody of [
    {},                                  // missing title
    { title: '' },                       // empty string
    { title: '   ' },                    // whitespace only
    { title: 42 },                       // wrong type
  ]) {
    const res = await fetch(`${base}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...badBody, column_id: 1 }),
    });
    assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(badBody)}`);
    const body = await res.json();
    assert.equal(body.error, 'Title is required');
  }
});

test('moving a task updates its column and is reflected on the next GET', async (t) => {
  const { base } = startTestServer(t);

  const before = await getBoard(base);
  const [todo, inProgress] = before.columns;
  const task = todo.tasks[0];
  assert.ok(task, 'seed should give To Do at least one task');

  const moveRes = await fetch(`${base}/tasks/${task.id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_id: inProgress.id }),
  });
  assert.equal(moveRes.status, 200);
  const moved = await moveRes.json();
  assert.equal(moved.column_id, inProgress.id);

  // And it must survive a fresh fetch (persistence, not in-memory state)
  const after = await getBoard(base);
  const nowInProgress = after.columns.find((c) => c.id === inProgress.id);
  const nowTodo = after.columns.find((c) => c.id === todo.id);
  assert.ok(nowInProgress.tasks.some((x) => x.id === task.id));
  assert.ok(!nowTodo.tasks.some((x) => x.id === task.id));
});

test('moving to a non-existent column is rejected; deleting twice 404s', async (t) => {
  const { base } = startTestServer(t);

  const moveRes = await fetch(`${base}/tasks/1/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_id: 9999 }),
  });
  assert.equal(moveRes.status, 400);
  assert.equal((await moveRes.json()).error, 'Invalid column');

  assert.equal((await fetch(`${base}/tasks/1`, { method: 'DELETE' })).status, 204);
  const secondDelete = await fetch(`${base}/tasks/1`, { method: 'DELETE' });
  assert.equal(secondDelete.status, 404);
  assert.equal((await secondDelete.json()).error, 'Task not found');
});
