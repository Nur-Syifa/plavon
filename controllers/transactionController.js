/**
 * Transaction Controller
 * 
 * Menangani operasi terkait transaksi dan statistik penjualan.
 * Termasuk get transactions, summary, dan top selling items.
 */

const { db } = require('../config/database');

/**
 * Mengambil semua transaksi (legacy - sekarang menggunakan tabel pesanan)
 * Data diambil dari pesanan dan detail_pesanan dengan format kompatibel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTransactions(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    let sql = `
      SELECT
        p.id as no,
        p.created_at as tanggal,
        p.nama_pelanggan as konsumen,
        p.no_nota as nota,
        dp.nama_produk as barang,
        dp.jumlah as qty,
        0 as kulak,
        dp.harga as jual,
        0 as total_kulak,
        dp.subtotal as total_jual,
        (dp.subtotal - (dp.jumlah * 0)) as profit
      FROM pesanan p
      LEFT JOIN detail_pesanan dp ON p.id = dp.pesanan_id
      WHERE 1=1
    `;

    const params = [];

    // Add date filter if provided
    if (startDate && endDate) {
      sql += ` AND DATE(p.created_at) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      sql += ` AND DATE(p.created_at) >= ?`;
      params.push(startDate);
    } else if (endDate) {
      sql += ` AND DATE(p.created_at) <= ?`;
      params.push(endDate);
    }

    sql += `
      ORDER BY p.id DESC
      LIMIT ?
    `;
    params.push(limit);

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching transactions:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil ringkasan transaksi (total penjualan, profit, dll)
 * Menggunakan tabel pesanan dan detail_pesanan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTransactionsSummary(req, res) {
  try {
    const defaultSummary = {
      totalTransaksi: 0,
      totalBarangTerjual: 0,
      totalPenjualan: 0,
      totalModal: 0,
      totalProfit: 0
    };

    // Helper functions untuk query database dengan Promise
    const safeGet = (sql, params = []) => new Promise((resolve) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          resolve(null);
          return;
        }
        resolve(row || null);
      });
    });

    const safeAll = (sql, params = []) => new Promise((resolve) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          resolve([]);
          return;
        }
        resolve(rows || []);
      });
    });

    // Cek apakah tabel products memiliki kolom modal
    db.all("PRAGMA table_info(products)", [], async (err, columns) => {
      if (err) {
        console.error('Error fetching transactions summary:', err.message);
        return res.json(defaultSummary);
      }

      const hasModalColumn = (columns || []).some((col) => col.name === 'modal');

      // Ambil data ringkasan
      const totalTransaksiRow = await safeGet('SELECT COUNT(DISTINCT id) as totalTransaksi FROM pesanan');
      const totalBarangTerjualRow = await safeGet('SELECT COALESCE(SUM(jumlah), 0) as totalBarangTerjual FROM detail_pesanan');
      const totalPenjualanRow = await safeGet('SELECT COALESCE(SUM(total_harga), 0) as totalPenjualan FROM pesanan');

      let totalModal = 0;
      let totalProfit = 0;

      if (hasModalColumn) {
        // Jika ada kolom modal, hitung menggunakan modal dari produk
        const totalModalRow = await safeGet(`
          SELECT COALESCE(SUM(dp.jumlah * prod.modal), 0) as totalModal
          FROM detail_pesanan dp
          LEFT JOIN products prod ON dp.nama_produk = prod.name
        `);
        const totalProfitRow = await safeGet(`
          SELECT COALESCE(SUM(dp.jumlah * (dp.harga - COALESCE(prod.modal, 0))), 0) as totalProfit
          FROM detail_pesanan dp
          LEFT JOIN products prod ON dp.nama_produk = prod.name
        `);

        totalModal = totalModalRow?.totalModal || 0;
        totalProfit = totalProfitRow?.totalProfit || 0;
      } else {
        // Jika tidak ada kolom modal, gunakan price sebagai modal
        const details = await safeAll(`
          SELECT nama_produk, harga, jumlah
          FROM detail_pesanan
          WHERE nama_produk IS NOT NULL
        `);
        const products = await safeAll(`
          SELECT name, COALESCE(price, 0) as price
          FROM products
        `);

        const productPriceMap = new Map(products.map((p) => [p.name, Number(p.price) || 0]));
        details.forEach((d) => {
          const qty = Number(d.jumlah) || 0;
          const modalPerItem = productPriceMap.get(d.nama_produk) || 0;
          const hargaJual = Number(d.harga) || 0;
          totalModal += qty * modalPerItem;
          totalProfit += qty * (hargaJual - modalPerItem);
        });
      }

      res.json({
        totalTransaksi: totalTransaksiRow?.totalTransaksi || 0,
        totalBarangTerjual: totalBarangTerjualRow?.totalBarangTerjual || 0,
        totalPenjualan: totalPenjualanRow?.totalPenjualan || 0,
        totalModal,
        totalProfit
      });
    });
  } catch (error) {
    console.error('Error in getTransactionsSummary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil barang terlaris berdasarkan jumlah terjual
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTopItems(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const sql = `
      SELECT 
        dp.nama_produk as barang,
        SUM(dp.jumlah) as totalQty
      FROM pesanan p
      LEFT JOIN detail_pesanan dp ON p.id = dp.pesanan_id
      WHERE dp.nama_produk IS NOT NULL AND dp.nama_produk != ''
      GROUP BY dp.nama_produk
      ORDER BY totalQty DESC
      LIMIT ?
    `;
    
    db.all(sql, [limit], (err, rows) => {
      if (err) {
        console.error('Error fetching top items:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error in getTopItems:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export semua fungsi controller
module.exports = {
  getTransactions,
  getTransactionsSummary,
  getTopItems
};