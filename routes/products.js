/**
 * Product Routes
 * 
 * Mendefinisikan semua route endpoint terkait produk.
 * Menggunakan productController untuk menangani request.
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * @route   GET /api/products
 * @desc    Mengambil semua produk dengan filter kategori opsional
 * @access  Public
 * @query   category - Filter by category (k1, k2, k3, k4, other, all)
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/categories
 * @desc    Mengambil semua kategori produk unik
 * @access  Public
 */
router.get('/categories', productController.getCategories);

/**
 * @route   GET /api/products/variants
 * @desc    Mengambil varian produk untuk modal "All Products"
 * @access  Public
 * @query   category - Filter by category (optional)
 */
router.get('/variants', productController.getProductVariants);

/**
 * @route   GET /api/products/:id
 * @desc    Mengambil produk berdasarkan ID
 * @access  Public
 * @param   id - ID produk
 */
router.get('/:id', productController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Membuat produk baru
 * @access  Public (tapi sebaiknya admin only di production)
 * @body    { name, category, price, specs, image }
 */
router.post('/', productController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update produk yang sudah ada
 * @access  Public (tapi sebaiknya admin only di production)
 * @param   id - ID produk
 * @body    { name, category, price, specs, image }
 */
router.put('/:id', productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Menghapus produk berdasarkan ID
 * @access  Public (tapi sebaiknya admin only di production)
 * @param   id - ID produk
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;
