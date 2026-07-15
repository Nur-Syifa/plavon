const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../database');
const dbPath = path.join(dbDir, 'database.db'); // <-- SAMAIN JADI database.db

if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('Connected to SQLite database at:', dbPath);

function closeDatabase() {
  db.close();
}

module.exports = { db, closeDatabase };
