/**
 * Order Controller
 * Versi better-sqlite3
 */

const { db } = require('../config/database');
const { validateOrder, validateOrderStatus, sanitizeString } = require('../utils/validators');

/**
 * Membuat pesanan baru
 */
function createOrder(req, res) {
  try {
    const { nama_pelanggan, alamat, telepon, items, total_harga, metode_pembayaran } = req.body;
    
    const sanitizedData = {
      nama_pelanggan: sanitizeString(nama_pelanggan || ''),
      alamat: sanitizeString(alamat || ''),
      telepon: sanitizeString(telepon || ''),
      items: items || [],
      total_harga: parseFloat(total_harga) || 0,
      metode_pembayaran: sanitizeString(metode_pembayaran || 'COD')
    };
    
    const validation = validateOrder(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Data pesanan tidak valid',
        details: validation.errors 
      });
    }
    
    const no_nota = `AJ${Date.now().toString().slice(-6)}`;
    
    // 1. Insert ke tabel pesanan
    const orderStmt = db.prepare(`
      INSERT INTO pesanan (no_nota, nama_pelanggan, alamat, telepon, total_harga, metode_pembayaran, status)
      VALUES (?, ?, ?, ?, ?, ? 'pending')
    `);
    
    const info = orderStmt.run(
      no_nota, 
      sanitizedData.nama_pelanggan, 
      sanitizedData.alamat, 
      sanitizedData.telepon, 
      sanitizedData.total_harga, 
      sanitizedData.metode_pembayaran
    );
    
    const pesananId = info.lastInsertRowid; // <-- penting
    
    // 2. Insert detail pesanan
    const detailStmt = db.prepare(`
      INSERT INTO detail_pesanan (pesanan_id, nama_produk, harga, jumlah, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertDetails = db.transaction((items) => {
      for (const item of items) {
        const subtotal = item.price * item.quantity;
        detailStmt.run(pesananId, item.title, item.price, item.quantity, subtotal);
      }
    });
    
    insertDetails(sanitizedData.items); // pake transaction biar aman

    res.status(201).json({
      success: true,
      pesanan_id: pesananId,
      no_nota: no_nota,
      message: 'Pemesanan berhasil dibuat'
    });

  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil pesanan berdasarkan ID
 */
function getOrderById(req, res) {
  try {
    const pesananId = req.params.id;
    
    const pesananStmt = db.prepare('SELECT * FROM pesanan WHERE id = ?');
    const pesanan = pesananStmt.get(pesananId);
    
    if (!pesanan) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    
    const detailStmt = db.prepare('SELECT * FROM detail_pesanan WHERE pesanan_id = ?');
    const details = detailStmt.all(pesananId);
    
    res.json({
      ...pesanan,
      items: details
    });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil pesanan berdasarkan nomor nota
 */
function getOrderByNota(req, res) {
  try {
    const noNota = req.params.noNota;
    
    const pesananStmt = db.prepare('SELECT * FROM pesanan WHERE no_nota = ?');
    const pesanan = pesananStmt.get(noNota);
    
    if (!pesanan) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    
    const detailStmt = db.prepare('SELECT * FROM detail_pesanan WHERE pesanan_id = ?');
    const details = detailStmt.all(pesanan.id);
    
    res.json({
      ...pesanan,
      items: details
    });
  } catch (error) {
    console.error('Error in getOrderByNota:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update status pesanan
 */
function updateOrderStatus(req, res) {
  try {
    const pesananId = req.params.id;
    const { status } = req.body;
    
    const validation = validateOrderStatus(status);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Status tidak valid',
        details: validation.errors 
      });
    }
    
    const stmt = db.prepare('UPDATE pesanan SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run(status, pesananId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    
    res.json({
      success: true,
      message: 'Status pesanan berhasil diupdate'
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil semua pesanan dengan filter status opsional
 */
function getOrders(req, res) {
  try {
    const status = req.query.status;
    
    let sql = `
      SELECT p.*, 
             COUNT(dp.id) as total_items
      FROM pesanan p
      LEFT JOIN detail_pesanan dp ON p.id = dp.pesanan_id
    `;
    
    let params = [];
    
    if (status && status !== 'all') {
      sql += ' WHERE p.status = ?';
      params.push(status);
    }
    
    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';
    
    const stmt = db.prepare(sql);
    const rows = stmt.all(params);
    res.json(rows);
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createOrder,
  getOrderById,
  getOrderByNota,
  updateOrderStatus,
  getOrders
};
