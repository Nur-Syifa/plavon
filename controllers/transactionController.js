/**
 * Transaction Controller
 * Versi better-sqlite3
 */

const { db } = require('../config/database');

/**
 * Mengambil semua transaksi
 */
function getTransactions(req, res) {
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

    sql += ` ORDER BY p.id DESC LIMIT ?`;
    params.push(limit);

    const stmt = db.prepare(sql);
    const rows = stmt.all(params); // <-- ganti db.all
    res.json(rows);
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil ringkasan transaksi
 */
function getTransactionsSummary(req, res) {
  try {
    const defaultSummary = {
      totalTransaksi: 0,
      totalBarangTerjual: 0,
      totalPenjualan: 0,
      totalModal: 0,
      totalProfit: 0
    };

    // Cek apakah tabel products memiliki kolom modal
    const columns = db.pragma('table_info(products)');
    const hasModalColumn = columns.some((col) => col.name === 'modal');

    // Ambil data ringkasan - langsung pake .get()
    const totalTransaksiRow = db.prepare('SELECT COUNT(DISTINCT id) as totalTransaksi FROM pesanan').get();
    const totalBarangTerjualRow = db.prepare('SELECT COALESCE(SUM(jumlah), 0) as totalBarangTerjual FROM detail_pesanan').get();
    const totalPenjualanRow = db.prepare('SELECT COALESCE(SUM(total_harga), 0) as totalPenjualan FROM pesanan').get();

    let totalModal = 0;
    let totalProfit = 0;

    if (hasModalColumn) {
      const totalModalRow = db.prepare(`
        SELECT COALESCE(SUM(dp.jumlah * prod.modal), 0) as totalModal
        FROM detail_pesanan dp
        LEFT JOIN products prod ON dp.nama_produk = prod.name
      `).get();
      
      const totalProfitRow = db.prepare(`
        SELECT COALESCE(SUM(dp.jumlah * (dp.harga - COALESCE(prod.modal, 0))), 0) as totalProfit
        FROM detail_pesanan dp
        LEFT JOIN products prod ON dp.nama_produk = prod.name
      `).get();

      totalModal = totalModalRow?.totalModal || 0;
      totalProfit = totalProfitRow?.totalProfit || 0;
    } else {
      const details = db.prepare('SELECT nama_produk, harga, jumlah FROM detail_pesanan WHERE nama_produk IS NOT NULL').all();
      const products = db.prepare('SELECT name, COALESCE(price, 0) as price FROM products').all();

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
  } catch (error) {
    console.error('Error in getTransactionsSummary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mengambil barang terlaris
 */
function getTopItems(req, res) {
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
    
    const stmt = db.prepare(sql);
    const rows = stmt.all(limit); // <-- ganti db.all
    res.json(rows);
  } catch (error) {
    console.error('Error in getTopItems:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getTransactions,
  getTransactionsSummary,
  getTopItems
};
