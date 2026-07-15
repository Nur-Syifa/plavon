/**
 * Checkout Module
 * 
 * Menangani semua operasi terkait checkout:
 * - Open/close checkout modal
 * - Submit checkout form
 * - Tampilkan konfirmasi pesanan
 */

/**
 * Open checkout modal
 */
function openCheckoutModal() {
  if (cart.length === 0) {
    showNotification('Keranjang belanja kosong!');
    return;
  }

  const modal = document.getElementById('checkoutModal');
  const checkoutItems = document.getElementById('checkoutItems');
  const checkoutTotal = document.getElementById('checkoutTotal');
  
  // Display cart items di checkout modal
  let itemsHTML = '';
  let total = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    itemsHTML += `
      <div class="checkout-item">
        <div class="checkout-item-info">
          <span class="checkout-item-name">${item.title}</span>
          <span class="checkout-item-price">${formatCurrency(item.price)} x ${item.quantity}</span>
        </div>
        <span class="checkout-item-subtotal">${formatCurrency(itemTotal)}</span>
      </div>
    `;
  });
  
  checkoutItems.innerHTML = itemsHTML;
  checkoutTotal.textContent = formatCurrency(total);
  
  modal.style.display = 'flex';
}

/**
 * Close checkout modal
 */
function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  modal.style.display = 'none';
}

/**
 * Submit checkout form
 * @param {Event} event - Form submit event
 */
async function submitCheckout(event) {
  event.preventDefault();
  
  const nama = document.getElementById('nama').value;
  const alamat = document.getElementById('alamat').value;
  const telepon = document.getElementById('telepon').value;
  const pembayaran = document.getElementById('pembayaran').value;
  
  if (cart.length === 0) {
    showNotification('Keranjang belanja kosong!');
    return;
  }
  
  // Calculate total
  const total = getCartTotal();
  
  // Prepare order data
  const orderData = {
    nama_pelanggan: nama,
    alamat: alamat,
    telepon: telepon,
    items: cart,
    total_harga: total,
    metode_pembayaran: pembayaran
  };
  
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Close modal
      closeCheckoutModal();
      
      // Show order confirmation dengan no nota
      showOrderConfirmation(result.no_nota, total, nama);
      
      // Clear cart
      clearCart();
      
      // Reset form
      document.getElementById('checkoutForm').reset();
    } else {
      showNotification('Gagal membuat pesanan. Silakan coba lagi.');
    }
  } catch (error) {
    console.error('Error submitting order:', error);
    showNotification('Terjadi kesalahan. Silakan coba lagi.');
  }
}

/**
 * Show order confirmation modal
 * @param {string} noNota - Nomor nota pesanan
 * @param {number} total - Total harga
 * @param {string} nama - Nama pelanggan
 */
function showOrderConfirmation(noNota, total, nama) {
  // Remove existing modal jika ada
  const existingModal = document.getElementById('orderConfirmationModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'orderConfirmationModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 4000;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 40px;
      border-radius: 10px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    ">
      <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
      <h2 style="color: #32C03C; margin-bottom: 10px;">Pesanan Berhasil!</h2>
      <p style="color: #666; margin-bottom: 20px;">
        Terima kasih, ${nama}! Pesanan Anda telah kami terima.
      </p>
      
      <div style="
        background: #f5f5f5;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      ">
        <p style="color: #666; margin: 0 0 10px 0;">Nomor Nota Pesanan Anda:</p>
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        ">
          <code style="
            font-size: 24px;
            font-weight: bold;
            color: #000;
            background: white;
            padding: 10px 20px;
            border-radius: 5px;
            border: 2px solid #32C03C;
          ">${noNota}</code>
          <button onclick="copyToClipboard('${noNota}')" style="
            background: #32C03C;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 20px;
          ">📋</button>
        </div>
        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">Klik tombol copy untuk menyalin nomor nota</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="color: #666; margin: 0;">Total Pembayaran:</p>
        <p style="color: #32C03C; font-size: 28px; font-weight: bold; margin: 5px 0;">
          ${formatCurrency(total)}
        </p>
      </div>
      
      <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
        Simpan nomor nota ini untuk mengecek status pesanan Anda.
      </p>
      
      <button onclick="closeOrderConfirmation()" style="
        background: #32C03C;
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
      ">Tutup</button>
      
      <div style="margin-top: 15px;">
        <button onclick="closeOrderConfirmation(); openCheckNotaModal()" style="
          background: transparent;
          color: #32C03C;
          border: 2px solid #32C03C;
          padding: 8px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        ">Cek Status Pesanan</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/**
 * Close order confirmation modal
 */
function closeOrderConfirmation() {
  const modal = document.getElementById('orderConfirmationModal');
  if (modal) {
    modal.remove();
  }
}