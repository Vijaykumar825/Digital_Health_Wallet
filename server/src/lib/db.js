import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'health_wallet.sqlite');

export const db = new sqlite3.Database(dbPath);

export function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        vitals_json TEXT,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS vitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Link vitals to their source report if available (for cascading deletions in app logic)
      // SQLite cannot add a foreign key via ALTER TABLE, but we can add the column and index it.
      db.run(`ALTER TABLE vitals ADD COLUMN report_id INTEGER`, () => {
        // ignore error if column already exists
      });
      db.run(`CREATE INDEX IF NOT EXISTS idx_vitals_report_id ON vitals(report_id)`);

      db.run(`CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        shared_with_user_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('viewer')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(report_id, shared_with_user_id),
        FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE CASCADE,
        FOREIGN KEY(shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) reject(err); else resolve();
      });
    });
  });
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
