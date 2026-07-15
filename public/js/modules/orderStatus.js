/**
 * Order Status Module
 * 
 * Menangani semua operasi terkait cek status pesanan:
 * - Open/close cek nota modal
 * - Check order status by no nota
 * - Display order status
 */

/**
 * Open cek nota modal
 */
function openCheckNotaModal() {
  // Remove existing modal jika ada
  const existingModal = document.getElementById('checkNotaModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'checkNotaModal';
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
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      max-height: 90vh;
      overflow-y: auto;
      margin: auto;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #000; margin: 0;">Cek Status Pesanan</h2>
        <button onclick="closeCheckNotaModal()" style="
          background: none;
          border: none;
          font-size: 30px;
          cursor: pointer;
          color: #666;
        ">&times;</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #333; font-weight: bold;">Masukkan Nomor Nota:</label>
        <input type="text" id="checkNotaInput" placeholder="Contoh: AJ123456" style="
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          box-sizing: border-box;
        ">
      </div>
      
      <button onclick="checkOrderStatus()" style="
        background: #32C03C;
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        width: 100%;
      ">Cek Pesanan</button>
      
      <div id="orderStatusResult" style="margin-top: 20px;"></div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus pada input
  setTimeout(() => {
    document.getElementById('checkNotaInput').focus();
  }, 100);
}

/**
 * Close cek nota modal
 */
function closeCheckNotaModal() {
  const modal = document.getElementById('checkNotaModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Check order status by no nota
 */
async function checkOrderStatus() {
  const noNota = document.getElementById('checkNotaInput').value.trim();
  const resultDiv = document.getElementById('orderStatusResult');
  
  if (!noNota) {
    showNotification('Masukkan nomor nota!');
    return;
  }
  
  try {
    resultDiv.innerHTML = '<div style="text-align: center; color: #666;">Memuat data pesanan...</div>';
    
    const response = await fetch(`/api/orders/nota/${noNota}`);
    const order = await response.json();
    
    if (response.status === 404) {
      resultDiv.innerHTML = `
        <div style="
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
        ">
          ❌ Pesanan dengan nomor nota "${noNota}" tidak ditemukan
        </div>
      `;
      return;
    }
    
    // Status color mapping
    const statusColors = {
      'pending': '#FFD700',
      'proses': '#FF8C00',
      'kirim': '#00BFFF',
      'selesai': '#00FF00'
    };
    
    const statusColor = statusColors[order.status] || '#FFD700';
    
    // Format date
    const date = new Date(order.created_at);
    const formattedDate = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let itemsHTML = '';
    order.items.forEach((item) => {
      itemsHTML += `
        <div style="
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        ">
          <div>
            <div style="font-weight: bold;">${item.nama_produk}</div>
            <div style="color: #666; font-size: 14px;">${formatCurrency(item.harga)} × ${item.jumlah}</div>
          </div>
          <div style="font-weight: bold; color: #32C03C;">${formatCurrency(item.subtotal)}</div>
        </div>
      `;
    });
    
    resultDiv.innerHTML = `
      <div style="
        background: #f5f5f5;
        padding: 20px;
        border-radius: 8px;
        border: 2px solid #32C03C;
      ">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 40px; margin-bottom: 10px;">📦</div>
          <h3 style="color: #000; margin: 0;">${order.no_nota}</h3>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">${formattedDate}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            background: ${statusColor};
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">${order.status.toUpperCase()}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #666; margin: 5px 0;"><strong>Nama:</strong> ${order.nama_pelanggan}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Alamat:</strong> ${order.alamat}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Telepon:</strong> ${order.telepon}</p>
          <p style="color: #666; margin: 5px 0;"><strong>Metode Pembayaran:</strong> ${order.metode_pembayaran}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0;">Detail Pesanan:</h4>
          <div style="background: white; padding: 15px; border-radius: 5px;">
            ${itemsHTML}
          </div>
        </div>
        
        <div style="
          text-align: right;
          padding-top: 15px;
          border-top: 2px solid #32C03C;
        ">
          <p style="margin: 0; color: #666;">Total:</p>
          <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #32C03C;">
            ${formatCurrency(order.total_harga)}
          </p>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error checking order status:', error);
    resultDiv.innerHTML = `
      <div style="
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 15px;
        border-radius: 5px;
        text-align: center;
      ">
        ❌ Terjadi kesalahan. Silakan coba lagi.
      </div>
    `;
  }
}