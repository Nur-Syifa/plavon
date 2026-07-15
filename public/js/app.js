/**
 * Main Application Entry Point
 * 
 * File utama yang menginisialisasi semua modul aplikasi.
 * File ini berfungsi sebagai orchestrator untuk menghubungkan semua modul.
 */

// Initialize app saat page load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize modules
  loadProducts();
  loadAllProductVariants();
  renderCart();
  updateCartCount();
  setupSlideshow();
});