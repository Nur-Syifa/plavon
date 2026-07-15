/**
 * Database Initialization & Seeding
 * 
 * Modul ini menangani inisialisasi database SQLite,
 * pembuatan tabel, dan seeding data awal.
 * 
 * Catatan: Database connection sekarang dihandle oleh config/database.js
 * Modul ini hanya untuk inisialisasi tabel dan data awal.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'products.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
  initializeDatabase();
});

/**
 * Inisialisasi database: membuat tabel jika belum ada dan seeding data
 */
function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        modal INTEGER DEFAULT 0,
        specs TEXT NOT NULL,
        image TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
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
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS detail_pesanan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pesanan_id INTEGER NOT NULL,
        nama_produk TEXT NOT NULL,
        harga REAL NOT NULL,
        jumlah INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (pesanan_id) REFERENCES pesanan(id)
      )
    `);

    db.run(`
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
      )
    `);

    // Keep compatibility for older dashboard data import history.
    db.run(`
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
      )
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
  });
}

/**
 * Pastikan kolom ada di tabel, jika belum ada tambahkan
 */
function ensureColumnExists(tableName, columnName, columnDefinition, afterAddSql) {
  db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
    if (err) {
      console.error(`Error checking ${tableName} columns:`, err.message);
      return;
    }

    const hasColumn = (columns || []).some((col) => col.name === columnName);
    if (hasColumn) return;

    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (alterErr) => {
      if (alterErr) {
        console.error(`Error adding ${columnName} to ${tableName}:`, alterErr.message);
        return;
      }
      if (afterAddSql) {
        db.run(afterAddSql);
      }
    });
  });
}

/**
 * Cek apakah tabel produk kosong, jika ya insert sample products
 */
function checkAndInsertSampleProducts() {
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) {
      console.error('Error checking products count:', err.message);
      return;
    }
    if ((row?.count || 0) === 0) {
      insertSampleProducts();
    }
  });
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
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleProducts.forEach((product) => {
    insert.run(
      product.name,
      product.category,
      product.price,
      product.modal,
      product.specs,
      product.image
    );
  });

  insert.finalize();
}

/**
 * Seed default varian produk jika tabel masih kosong
 */
function seedDefaultVariantsIfEmpty() {
  db.get('SELECT COUNT(*) as count FROM product_varian', (countErr, countRow) => {
    if (countErr) {
      console.error('Error checking varian count:', countErr.message);
      return;
    }
    if ((countRow?.count || 0) > 0) return;

    db.all('SELECT id, name, category, price, specs, image FROM products', [], (err, rows) => {
      if (err) {
        console.error('Error reading products for varian seed:', err.message);
        return;
      }
      if (!rows || rows.length === 0) return;
      seedVariantsFromModalData(rows);
    });
  });
}

/**
 * Upgrade old seed (base product names) to real modal variants
 */
function migrateLegacyVariantSeedIfNeeded() {
  db.all('SELECT id, nama_varian FROM product_varian', [], (err, rows) => {
    if (err || !rows || rows.length === 0) return;

    const masterNames = new Set([
      'K.1 PREMIUM',
      'K.2 SHAFON',
      'K.3 TITAN',
      'K.4 ELEPHANT',
      'Panel Gypsum Perforated',
      'WALL PANEL COMPASITE',
      'LIST VIGURA',
      'LIST PVC'
    ]);

    const allAreMasterNames = rows.every((r) => masterNames.has(r.nama_varian));
    if (!allAreMasterNames) return;

    db.run('DELETE FROM product_varian', [], (deleteErr) => {
      if (deleteErr) {
        console.error('Error cleaning legacy varian seed:', deleteErr.message);
        return;
      }

      db.all('SELECT id, name, category, price, specs, image FROM products', [], (prodErr, products) => {
        if (prodErr || !products || products.length === 0) return;
        seedVariantsFromModalData(products);
      });
    });
  });
}

/**
 * Seed varian produk dari data produk
 */
function seedVariantsFromModalData(products) {
  const productIdMap = new Map(products.map((p) => [p.name, p.id]));
  const variants = [
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM ED2046', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/ED2046.jpg' },
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM ED2050', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/ED2050.jpg.jpg' },
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM ED2051', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/ED2051.jpg.jpg' },
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM ED2052', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/ED2052.jpg.jpg' },
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM EF2045', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/EF2045.jpg' },
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM EF2046', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/EF2046.jpg' },
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM EF2047', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/EF2047.jpg' },
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM EF2050', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/EF2050.jpg' },
    { productName: 'K.1 PREMIUM', category: 'k1', nama_varian: 'K.1 PREMIUM EF2052', harga: 45000, specs: 'Tebal 8 mm • Lebar 20 cm • Finishing glossy', image: '../images/K1/EF2052.jpg' },

    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 1', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/1.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 2', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/2.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 3', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/3.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 4', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/4.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 5', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/5.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 6', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/6.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 7', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/7.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 8', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/8.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 10', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/10.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 11', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/11.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 12', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/12.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 13', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/13.jpg' },
    { productName: 'K.2 SHAFON', category: 'k2', nama_varian: 'K.2 SHAFON 16', harga: 42000, specs: 'Tebal 8 mm • Lebar 20 cm • Motif elegan', image: '../images/k2/16.jpg' },

    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN DU', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/du.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN EM', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/em.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN LI', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/li.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN SA', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/sa.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN TI', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/ti.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN 1', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/1.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN 2', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/2.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN 3', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/3.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN 4', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/4.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN 5', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/5.jpg' },
    { productName: 'K.3 TITAN', category: 'k3', nama_varian: 'K.3 TITAN 6', harga: 38000, specs: 'Tebal 7 mm • Lebar 20 cm • Warna netral', image: '../images/k3/6.jpg' },

    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 1', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/1.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 2', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/2.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 3', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/3.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 4', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/4.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 5', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/5.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 6', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/6.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 7', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/7.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 8', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/8.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 9', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/9.jpg' },
    { productName: 'K.4 ELEPHANT', category: 'k4', nama_varian: 'K.4 ELEPHANT 11', harga: 39000, specs: 'Tebal 7 mm • Lebar 20 cm • Motif batu alam', image: '../images/k4/11.jpg' }
  ];

  const insert = db.prepare(`
    INSERT INTO product_varian (product_id, category, nama_varian, harga, specs, image, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  variants.forEach((variant) => {
    insert.run(
      productIdMap.get(variant.productName) || null,
      variant.category,
      variant.nama_varian,
      variant.harga,
      variant.specs,
      variant.image
    );
  });
  insert.finalize();
}

module.exports = db;