const { createDb } = require('../src/db');
const { seedDatabase } = require('../seed');
const { createApp } = require('../src/app');

/** Boot the real app against a fresh, seeded in-memory database. */
function startTestServer(t) {
  const db = createDb(':memory:');
  seedDatabase(db);
  const app = createApp(db);
  const server = app.listen(0);
  t.after(() => {
    server.close();
    db.close();
  });
  const { port } = server.address();
  return { base: `http://127.0.0.1:${port}`, db };
}

/** Convenience helper: fetch the nested board and index it for assertions. */
async function getBoard(base) {
  const res = await fetch(`${base}/boards/1`);
  return res.json();
}

module.exports = { startTestServer, getBoard };
