/**
 * Order Routes
 * 
 * Mendefinisikan semua route endpoint terkait pesanan.
 * Menggunakan orderController untuk menangani request.
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

/**
 * @route   POST /api/orders
 * @desc    Membuat pesanan baru
 * @access  Public
 * @body    { nama_pelanggan, alamat, telepon, items, total_harga, metode_pembayaran }
 */
router.post('/', orderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Mengambil semua pesanan dengan filter status opsional
 * @access  Public
 * @query   status - Filter by status (pending, proses, kirim, selesai, all)
 */
router.get('/', orderController.getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Mengambil pesanan berdasarkan ID
 * @access  Public
 * @param   id - ID pesanan
 */
router.get('/:id', orderController.getOrderById);

/**
 * @route   GET /api/orders/nota/:noNota
 * @desc    Mengambil pesanan berdasarkan nomor nota
 * @access  Public
 * @param   noNota - Nomor nota pesanan
 */
router.get('/nota/:noNota', orderController.getOrderByNota);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update status pesanan
 * @access  Public (tapi sebaiknya admin only di production)
 * @param   id - ID pesanan
 * @body    { status } - Status baru (pending, proses, kirim, selesai)
 */
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;