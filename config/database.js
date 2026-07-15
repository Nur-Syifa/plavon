/**
 * Database Configuration
 * Pake better-sqlite3
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path ke file database. Pastiin folder 'database' ada
const dbDir = path.join(__dirname, '../database');
const dbPath = path.join(dbDir, 'database.db');

// Bikin folder database kalau belum ada
if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir);
}

// Buat koneksi database - langsung konek, gak pake callback
const db = new Database(dbPath);

console.log('Connected to SQLite database at:', dbPath);

// Biar aman kalau ada banyak request
db.pragma('journal_mode = WAL');

/**
 * Menutup koneksi database dengan aman
 */
function closeDatabase() {
  db.close();
  console.log('Database connection closed successfully');
}

// Export database instance dan fungsi helper
module.exports = {
  db,
  closeDatabase
};
