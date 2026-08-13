const { createDb, DEFAULT_DB_PATH } = require('./db');
const { seedDatabase, isEmpty } = require('../seed');
const { createApp } = require('./app');

const dbPath = process.env.DB_PATH || DEFAULT_DB_PATH;
const db = createDb(dbPath);

// Fresh clones get a seeded board automatically on first run.
if (isEmpty(db)) {
  const { boardId } = seedDatabase(db);
  console.log(`[taskflow] fresh database — seeded board #${boardId}`);
}

const app = createApp(db);
const port = Number(process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => {
  console.log(`[taskflow] API listening on http://localhost:${port}`);
});
