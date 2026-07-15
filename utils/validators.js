/**
 * Validators Utility
 * 
 * Berisi fungsi-fungsi validasi untuk input data.
 * Digunakan untuk memastikan data yang masuk valid sebelum diproses.
 */

/**
 * Validasi data produk
 * @param {Object} productData - Data produk yang akan divalidasi
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateProduct(productData) {
  const errors = [];

  if (!productData.name || productData.name.trim() === '') {
    errors.push('Nama produk wajib diisi');
  }

  if (!productData.category || productData.category.trim() === '') {
    errors.push('Kategori produk wajib diisi');
  }

  if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
    errors.push('Harga produk harus berupa angka positif');
  }

  if (!productData.specs || productData.specs.trim() === '') {
    errors.push('Spesifikasi produk wajib diisi');
  }

  if (!productData.image || productData.image.trim() === '') {
    errors.push('Path gambar produk wajib diisi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validasi data pesanan
 * @param {Object} orderData - Data pesanan yang akan divalidasi
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateOrder(orderData) {
  const errors = [];

  if (!orderData.nama_pelanggan || orderData.nama_pelanggan.trim() === '') {
    errors.push('Nama pelanggan wajib diisi');
  }

  if (!orderData.alamat || orderData.alamat.trim() === '') {
    errors.push('Alamat wajib diisi');
  }

  if (!orderData.telepon || orderData.telepon.trim() === '') {
    errors.push('Nomor telepon wajib diisi');
  }

  // Validasi format nomor telepon (minimal 10 digit)
  if (orderData.telepon && !/^\d{10,}$/.test(orderData.telepon.replace(/\D/g, ''))) {
    errors.push('Nomor telepon tidak valid');
  }

  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Pesanan harus memiliki minimal 1 item');
  }

  if (orderData.items) {
    orderData.items.forEach((item, index) => {
      if (!item.title || item.title.trim() === '') {
        errors.push(`Item ${index + 1}: nama produk wajib diisi`);
      }
      if (!item.price || isNaN(item.price) || item.price <= 0) {
        errors.push(`Item ${index + 1}: harga harus berupa angka positif`);
      }
      if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: jumlah harus berupa angka positif`);
      }
    });
  }

  if (!orderData.total_harga || isNaN(orderData.total_harga) || orderData.total_harga <= 0) {
    errors.push('Total harga harus berupa angka positif');
  }

  // Validasi metode pembayaran
  const validPaymentMethods = ['COD', 'Transfer', 'E-Wallet'];
  if (orderData.metode_pembayaran && !validPaymentMethods.includes(orderData.metode_pembayaran)) {
    errors.push('Metode pembayaran tidak valid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validasi update status pesanan
 * @param {string} status - Status yang akan diupdate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateOrderStatus(status) {
  const errors = [];
  const validStatuses = ['pending', 'proses', 'kirim', 'selesai'];

  if (!status || status.trim() === '') {
    errors.push('Status wajib diisi');
  } else if (!validStatuses.includes(status)) {
    errors.push(`Status tidak valid. Pilihan: ${validStatuses.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitasi input string untuk mencegah XSS
 * @param {string} str - String yang akan disanitasi
 * @returns {string} - String yang sudah disanitasi
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '') // Hapus karakter < dan >
    .replace(/javascript:/gi, '') // Hapus javascript: protocol
    .replace(/on\w+=/gi, ''); // Hapus event handler inline
}

/**
 * Validasi kategori produk
 * @param {string} category - Kategori yang akan divalidasi
 * @returns {boolean} - True jika valid, false jika tidak
 */
function isValidCategory(category) {
  const validCategories = ['k1', 'k2', 'k3', 'k4', 'other'];
  return validCategories.includes(category);
}

module.exports = {
  validateProduct,
  validateOrder,
  validateOrderStatus,
  sanitizeString,
  isValidCategory
};