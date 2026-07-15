/**
 * Database Initialization & Seeding
 * Pake better-sqlite3 biar anti gagal di Railway
 */

const Database = require('better-sqlite3');
const path = require('path');

// Pake path yg sama kayak config/database.js biar 1 file
const dbPath = path.join(__dirname, '../database.db'); 
const db = new Database(dbPath);

console.log('Connected to SQLite database');
initializeDatabase();

/**
 * Inisialisasi database: membuat tabel jika belum ada dan seeding data
 */
function initializeDatabase() {
  // better-sqlite3 itu synchronous, jadi gak perlu db.serialize
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      modal INTEGER DEFAULT 0,
      specs TEXT NOT NULL,
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pesanan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no_nota TEXT,
      nama_pelanggan TEXT NOT NULL,
      alamat TEXT NOT NULL,
      telepon TEXT NOT NULL,
      total_harga REAL NOT NULL,
      metode_pembayaran TEXT DEFAULT 'COD',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS detail_pesanan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pesanan_id INTEGER NOT NULL,
      nama_produk TEXT NOT NULL,
      harga REAL NOT NULL,
      jumlah INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (pesanan_id) REFERENCES pesanan(id)
    );

    CREATE TABLE IF NOT EXISTS product_varian (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      category TEXT NOT NULL,
      nama_varian TEXT NOT NULL,
      harga INTEGER NOT NULL,
      specs TEXT,
      image TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no INTEGER,
      tanggal TEXT,
      konsumen TEXT,
      nota TEXT,
      barang TEXT,
      qty REAL,
      kulak REAL,
      jual REAL,
      total_kulak REAL,
      total_jual REAL,
      profit REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  ensureColumnExists('products', 'modal', 'INTEGER DEFAULT 0');
  ensureColumnExists(
    'pesanan',
    'updated_at',
    'DATETIME',
    'UPDATE pesanan SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)'
  );
  checkAndInsertSampleProducts();
  seedDefaultVariantsIfEmpty();
  migrateLegacyVariantSeedIfNeeded();
}

/**
 * Pastikan kolom ada di tabel, jika belum ada tambahkan
 */
function ensureColumnExists(tableName, columnName, columnDefinition, afterAddSql) {
  const columns = db.pragma(`table_info(${tableName})`);
  const hasColumn = columns.some((col) => col.name === columnName);
  if (hasColumn) return;

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  if (afterAddSql) {
    db.exec(afterAddSql);
  }
}

/**
 * Cek apakah tabel produk kosong, jika ya insert sample products
 */
function checkAndInsertSampleProducts() {
  const row = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if ((row?.count || 0) === 0) {
    insertSampleProducts();
  }
}

/**
 * Insert produk sampel ke database
 */
function insertSampleProducts() {
  const sampleProducts = [
    { name: 'K.1 PREMIUM', category: 'k1', price: 45000, modal: 38000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy • Cocok untuk ruang tamu', image: 'images/k1.PNG' },
    { name: 'K.2 SHAFON', category: 'k2', price: 42000, modal: 35000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan • Tahan lembab', image: 'images/k2.jpg' },
    { name: 'K.3 TITAN', category: 'k3', price: 38000, modal: 32000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral • Mudah dipasang', image: 'images/k3.PNG' },
    { name: 'K.4 ELEPHANT', category: 'k4', price: 39000, modal: 33000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam • Cocok untuk dapur', image: 'images/k4.jpg' },
    { name: 'Panel Gypsum Perforated', category: 'other', price: 110000, modal: 95000, specs: 'Akuistik baik • Desain modern • Untuk ruang kantor', image: 'images/GYPSUN.jpg' },
    { name: 'WALL PANEL COMPASITE', category: 'other', price: 35000, modal: 30000, specs: 'Kuat dan tajam • Tahan karat • Untuk pemasangan beton', image: 'images/BETON 3.jpg' },
    { name: 'LIST VIGURA', category: 'other', price: 8500, modal: 7000, specs: 'Tahan cuaca • Desain klasik • Umur panjang', image: 'images/LISTVIGURA2.jpg' },
    { name: 'LIST PVC', category: 'other', price: 75000, modal: 65000, specs: 'Kualitas kayu solid • Tahan air • Multi fungsi', image: 'images/LIST20.jpg' }
  ];

  const insert = db.prepare(`
    INSERT INTO products (name, category, price, modal, specs, image)
    VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((products) => {
    for (const product of products) insert.run(product);
  });
  insertMany(sampleProducts);
}

/**
 * Seed default varian produk jika tabel masih kosong
 */
function seedDefaultVariantsIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) as count FROM product_varian').get();
  if ((row?.count || 0) > 0) return;

  const rows = db.prepare('SELECT id, name, category, price, specs, image FROM products').all();
  if (!rows || rows.length === 0) return;
  seedVariantsFromModalData(rows);
}

/**
 * Upgrade old seed (base product names) to real modal variants
 */
function migrateLegacyVariantSeedIfNeeded() {
  const rows = db.prepare('SELECT id, nama_varian FROM product_varian').all();
  if (!rows || rows.length === 0) return;

  const masterNames = new Set([
    'K.1 PREMIUM','K.2 SHAFON','K.3 TITAN','K.4 ELEPHANT',
    'Panel Gypsum Perforated','WALL PANEL COMPASITE','LIST VIGURA','LIST PVC'
  ]);

  const allAreMasterNames = rows.every((r) => masterNames.has(r.nama_varian));
  if (!allAreMasterNames) return;

  db.exec('DELETE FROM product_varian');
  const products = db.prepare('SELECT id, name, category, price, specs, image FROM products').all();
  if (!products || products.length === 0) return;
  seedVariantsFromModalData(products);
}

/**
 * Seed varian produk dari data produk
 */
function seedVariantsFromModalData(products) {
  const productIdMap = new Map(products.map((p) => [p.name, p.id]));
  const variants = [ /* isi varian kamu yg panjang itu taruh di sini sama persis */ ];

  const insert = db.prepare(`
    INSERT INTO product_varian (product_id, category, nama_varian, harga, specs, image, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const insertMany = db.transaction((data) => {
    for (const v of data) {
      insert.run(
        productIdMap.get(v.productName) || null,
        v.category, v.nama_varian, v.harga, v.specs, v.image
      );
    }
  });
  insertMany(variants);
}

module.exports = db;
