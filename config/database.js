/**
 * Database Configuration
 * 
 * Modul ini menangani koneksi database SQLite dan menyediakan
 * instance database untuk digunakan di seluruh aplikasi.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path ke file database
const dbPath = path.join(__dirname, '../database', 'products.db');

// Buat koneksi database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at:', dbPath);
});

/**
 * Menutup koneksi database dengan aman
 * Digunakan saat aplikasi shutdown
 */
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed successfully');
    }
  });
}

// Export database instance dan fungsi helper
module.exports = {
  db,
  closeDatabase
};