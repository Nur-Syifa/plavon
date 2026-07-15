/**
 * Order Controller
 * 
 * Menangani semua operasi CRUD untuk pesanan.
 * Termasuk create, get by ID, get by nota, update status, dan filtering.
 */

const { db } = require('../config/database');
const { validateOrder, validateOrderStatus, sanitizeString } = require('../utils/validators');

/**
 * Membuat pesanan baru
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createOrder(req, res) {
  try {
    const { nama_pelanggan, alamat, telepon, items, total_harga, metode_pembayaran } = req.body;
    
    // Sanitasi input
    const sanitizedData = {
      nama_pelanggan: sanitizeString(nama_pelanggan || ''),
      alamat: sanitizeString(alamat || ''),
      telepon: sanitizeString(telepon || ''),
      items: items || [],
      total_harga: parseFloat(total_harga) || 0,
      metode_pembayaran: sanitizeString(metode_pembayaran || 'COD')
    };
    
    // Gunakan validator
    const validation = validateOrder(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Data pesanan tidak valid',
        details: validation.errors 
      });
    }
    
    // Generate nomor nota unik dengan format AJ + 6 digit timestamp
    const no_nota = `AJ${Date.now().toString().slice(-6)}`;
    
    // Insert ke tabel pesanan
    const sql = `
      INSERT INTO pesanan (no_nota, nama_pelanggan, alamat, telepon, total_harga, metode_pembayaran, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    
    db.run(sql, [
      no_nota, 
      sanitizedData.nama_pelanggan, 
      sanitizedData.alamat, 
      sanitizedData.telepon, 
      sanitizedData.total_harga, 
      sanitizedData.metode_pembayaran
    ], function(err) {
      if (err) {
        console.error('Error creating order:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      const pesananId = this.lastID;
      
      // Insert detail pesanan untuk setiap item
      const detailSql = `
        INSERT INTO detail_pesanan (pesanan_id, nama_produk, harga, jumlah, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      let itemsInserted = 0;
      const totalItems = items.length;
      let hasError = false;
      
      items.forEach(item => {
        const subtotal = item.price * item.quantity;
        db.run(detailSql, [pesananId, item.title, item.price, item.quantity, subtotal], (err) => {
          if (err) {
            console.error('Error inserting order detail:', err.message);
            hasError = true;
          }
          
          itemsInserted++;
          
          // Response setelah semua item selesai diinsert
          if (itemsInserted === totalItems) {
            if (hasError) {
              return res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan detail pesanan' });
            }
            
            res.status(201).json({
              success: true,
              pesanan_id: pesananId,
              no_nota: no_nota,
              message: 'Pemesanan berhasil dibuat'
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil pesanan berdasarkan ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getOrderById(req, res) {
  try {
    const pesananId = req.params.id;
    
    // Ambil data pesanan
    db.get('SELECT * FROM pesanan WHERE id = ?', [pesananId], (err, pesanan) => {
      if (err) {
        console.error('Error fetching order:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      if (!pesanan) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }
      
      // Ambil detail pesanan
      db.all('SELECT * FROM detail_pesanan WHERE pesanan_id = ?', [pesananId], (err, details) => {
        if (err) {
          console.error('Error fetching order details:', err.message);
          return res.status(500).json({ error: err.message });
        }
        
        res.json({
          ...pesanan,
          items: details
        });
      });
    });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil pesanan berdasarkan nomor nota
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getOrderByNota(req, res) {
  try {
    const noNota = req.params.noNota;
    
    // Ambil data pesanan berdasarkan no nota
    db.get('SELECT * FROM pesanan WHERE no_nota = ?', [noNota], (err, pesanan) => {
      if (err) {
        console.error('Error fetching order by nota:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      if (!pesanan) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }
      
      // Ambil detail pesanan
      db.all('SELECT * FROM detail_pesanan WHERE pesanan_id = ?', [pesanan.id], (err, details) => {
        if (err) {
          console.error('Error fetching order details:', err.message);
          return res.status(500).json({ error: err.message });
        }
        
        res.json({
          ...pesanan,
          items: details
        });
      });
    });
  } catch (error) {
    console.error('Error in getOrderByNota:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update status pesanan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateOrderStatus(req, res) {
  try {
    const pesananId = req.params.id;
    const { status } = req.body;
    
    // Gunakan validator
    const validation = validateOrderStatus(status);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Status tidak valid',
        details: validation.errors 
      });
    }
    
    // Update status dan updated_at
    const sql = 'UPDATE pesanan SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.run(sql, [status, pesananId], function(err) {
      if (err) {
        console.error('Error updating order status:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }
      
      res.json({
        success: true,
        message: 'Status pesanan berhasil diupdate'
      });
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil semua pesanan dengan filter status opsional
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getOrders(req, res) {
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
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching orders:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export semua fungsi controller
module.exports = {
  createOrder,
  getOrderById,
  getOrderByNota,
  updateOrderStatus,
  getOrders
};