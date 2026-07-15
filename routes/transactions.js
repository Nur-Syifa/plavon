/**
 * Transaction Routes
 * 
 * Mendefinisikan semua route endpoint terkait transaksi dan statistik penjualan.
 * Menggunakan transactionController untuk menangani request.
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

/**
 * @route   GET /api/transactions
 * @desc    Mengambil semua transaksi (legacy format dari pesanan)
 * @access  Public
 * @query   limit - Batas jumlah transaksi (default: 100)
 */
router.get('/', transactionController.getTransactions);

/**
 * @route   GET /api/transactions/summary
 * @desc    Mengambil ringkasan transaksi (total penjualan, profit, dll)
 * @access  Public
 */
router.get('/summary', transactionController.getTransactionsSummary);

/**
 * @route   GET /api/transactions/top-items
 * @desc    Mengambil barang terlaris berdasarkan jumlah terjual
 * @access  Public
 * @query   limit - Batas jumlah barang (default: 10)
 */
router.get('/top-items', transactionController.getTopItems);

module.exports = router;