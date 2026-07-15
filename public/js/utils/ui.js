/**
 * UI Utilities
 * 
 * Berisi fungsi-fungsi utility untuk manipulasi UI
 * seperti notification, modal, dll.
 */

/**
 * Menampilkan notifikasi toast
 * @param {string} message - Pesan yang akan ditampilkan
 */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #32C03C;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 3000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

/**
 * Menyalin teks ke clipboard
 * @param {string} text - Teks yang akan disalin
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Berhasil disalin! 📋');
  }).catch(err => {
    console.error('Error copying:', err);
    showNotification('Gagal menyalin');
  });
}

/**
 * Format angka ke format Rupiah
 * @param {number} amount - Angka yang akan diformat
 * @returns {string} - Format Rupiah
 */
function formatCurrency(amount) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// Tambahkan CSS animations untuk notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);