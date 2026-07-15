/**
 * Main Server Entry Point
 * 
 * Server Express.js untuk aplikasi Plafon PVC Store.
 * Menggunakan arsitektur modular dengan routes dan controllers terpisah.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { db, closeDatabase } = require('./config/database');
require('./database/init'); // Inisialisasi database dan seeding

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// Enable CORS
app.use(cors());

// Body parser middleware For Request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files middleware for render folder
app.use(express.static(path.join(__dirname, 'public')));

// ==================== API ROUTES ====================

// Import routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const transactionRoutes = require('./routes/transactions');

// Mount routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);

// ==================== PAGE ROUTES ====================

// Halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Halaman dashboard admin
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER STARTUP ====================

// Start server

app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Server is running!');
  console.log('=================================');
  console.log(`📱 Server URL: http://localhost:${PORT}`);
  console.log(`🏠 Home Page: http://localhost:${PORT}/`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔌 API Base: http://localhost:${PORT}/api`);
  console.log('=================================');
});

// ==================== GRACEFUL SHUTDOWN ====================

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  closeDatabase();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  closeDatabase();
  process.exit(1);
});
