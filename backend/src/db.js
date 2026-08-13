const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA_PATH = path.join(__dirname, '..', 'schema.sql');
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'taskflow.db');

/**
 * Open (creating if needed) a SQLite database, enforce foreign keys and
 * apply the schema. Pass ':memory:' for an isolated test database.
 *
 * Uses Node's built-in SQLite driver (Node >= 22.5), so the project has no
 * native dependencies to compile — `npm install` is all it takes.
 */
function createDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  return db;
}

module.exports = { createDb, DEFAULT_DB_PATH };
