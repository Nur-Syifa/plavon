// Dashboard JavaScript - Fetch data from API

// Global variables
let allOrders = [];
let allTransactions = [];
let filteredTransactions = [];
let summaryData = {};
let topItems = [];

// Login function
function login() {
  const user = document.getElementById('userid').value;
  const pass = document.getElementById('password').value;
  if (user === 'admin' && pass === '123321') {
    document.getElementById('login').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadDashboardData();
  } else {
    alert('Login gagal!');
  }
}

// Export transaksi ke Excel
function exportToExcel() {
  if (!allTransactions || allTransactions.length === 0) {
    alert('Data transaksi belum tersedia untuk diexport.');
    return;
  }

  const exportRows = allTransactions.map((t) => ({
    No: t.no || '',
    Tanggal: t.tanggal || '',
    Konsumen: t.konsumen || '',
    Nota: t.nota || '',
    Barang: t.barang || '',
    Qty: t.qty ?? '',
    Kulak: t.kulak ?? '',
    Jual: t.jual ?? '',
    TotalKulak: t.total_kulak ?? '',
    TotalJual: t.total_jual ?? '',
    Profit: t.profit ?? ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');
  XLSX.writeFile(workbook, `transaksi-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Fetch transactions summary
async function fetchTransactionsSummary() {
  try {
    const response = await fetch('/api/transactions/summary');
    const data = await response.json();
    summaryData = data;
    updateSummaryCards();
  } catch (error) {
    console.error('Error fetching summary:', error);
  }
}

// Fetch all transactions
async function fetchTransactions() {
  try {
    const response = await fetch('/api/transactions?limit=100');
    const data = await response.json();
    allTransactions = data;
    updateTransactionsTable();
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
}

// Fetch top selling items
async function fetchTopItems() {
  try {
    const response = await fetch('/api/transactions/top-items?limit=10');
    const data = await response.json();
    topItems = data;
    updateChart();
  } catch (error) {
    console.error('Error fetching top items:', error);
  }
}

// Update summary cards
function updateSummaryCards() {
  const cards = document.querySelectorAll('.summary .card');
  if (cards.length >= 5) {
    cards[0].textContent = `Total Transaksi: ${summaryData.totalTransaksi || 0}`;
    cards[1].textContent = `Total Barang Terjual: ${(summaryData.totalBarangTerjual || 0).toFixed(1)}`;
    cards[2].textContent = `Total Penjualan: Rp ${(summaryData.totalPenjualan || 0).toLocaleString('id-ID')}`;
    cards[3].textContent = `Total Modal: Rp ${(summaryData.totalModal || 0).toLocaleString('id-ID')}`;
    cards[4].textContent = `Profit: Rp ${(summaryData.totalProfit || 0).toLocaleString('id-ID')}`;
  }
}

// Update transactions table
function updateTransactionsTable() {
  const tableBody = document.querySelector('table tbody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  allTransactions.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${t.no || ''}</td>
      <td>${t.tanggal || ''}</td>
      <td>${t.konsumen || ''}</td>
      <td>${t.nota || ''}</td>
      <td>${t.barang || ''}</td>
      <td>${t.qty !== null ? t.qty : ''}</td>
      <td>${t.kulak !== null ? t.kulak : ''}</td>
      <td>${t.jual !== null ? t.jual : ''}</td>
      <td>${t.total_kulak !== null ? t.total_kulak : ''}</td>
      <td>${t.total_jual !== null ? t.total_jual : ''}</td>
      <td>${t.profit !== null ? t.profit : ''}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Update chart
function updateChart() {
  const ctx = document.getElementById('chart');
  if (!ctx) return;
  
  const chartInstance = Chart.getChart('chart');
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topItems.map(item => item.barang),
      datasets: [{
        label: 'Top 10 Barang Terlaris',
        data: topItems.map(item => item.totalQty),
        backgroundColor: 'gold',
        borderColor: 'white',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: 'gold'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'gold'
          }
        },
        y: {
          ticks: {
            color: 'gold'
          }
        }
      }
    }
  });
}

// Fetch all orders
async function fetchOrders(status = 'all') {
  try {
    let url = '/api/orders';
    if (status && status !== 'all') {
      url += `?status=${status}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    allOrders = data;
    renderOrders();
  } catch (error) {
    console.error('Error fetching orders:', error);
    document.getElementById('ordersList').innerHTML = '<div class="error">Gagal memuat pesanan</div>';
  }
}

// Filter orders by status
function filterOrdersByStatus(status) {
  fetchOrders(status);
  
  // Update active filter button
  const filterButtons = document.querySelectorAll('.status-filter-btn');
  filterButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'rgba(255, 255, 255, 0.1)';
    btn.style.color = 'gold';
    btn.style.border = '1px solid gold';
    if (btn.dataset.status === status) {
      btn.classList.add('active');
      btn.style.background = 'gold';
      btn.style.color = 'black';
      btn.style.border = 'none';
    }
  });
}

// Render orders list
async function renderOrders() {
  const ordersList = document.getElementById('ordersList');
  if (!ordersList) return;
  
  if (allOrders.length === 0) {
    ordersList.innerHTML = '<div class="empty-orders">Belum ada pesanan</div>';
    return;
  }
  
  ordersList.innerHTML = '';
  
  allOrders.forEach(order => {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.id = `order-${order.id}`;
    
    // Format date
    const date = new Date(order.created_at);
    const formattedDate = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    orderCard.innerHTML = `
      <div class="order-header" onclick="toggleOrderDetails(${order.id})">
        <div class="order-info">
          <div class="order-no">📦 ${order.no_nota}</div>
          <div class="order-meta">${formattedDate} • ${order.nama_pelanggan}</div>
        </div>
        <div style="display: flex; align-items: center;">
          <div class="order-total">Rp ${order.total_harga.toLocaleString('id-ID')}</div>
          <div class="expand-icon">▼</div>
        </div>
      </div>
      <div class="order-details" id="order-details-${order.id}">
        <div class="loading">Memuat detail pesanan...</div>
      </div>
    `;
    
    ordersList.appendChild(orderCard);
  });
}

// Toggle order details
async function toggleOrderDetails(orderId) {
  const orderCard = document.getElementById(`order-${orderId}`);
  const orderDetails = document.getElementById(`order-details-${orderId}`);
  
  if (!orderCard || !orderDetails) return;
  
  // Toggle expanded class
  orderCard.classList.toggle('expanded');
  
  // If expanding and not loaded yet, fetch details
  if (orderCard.classList.contains('expanded') && orderDetails.querySelector('.loading')) {
    await fetchOrderDetails(orderId);
  }
}

// Fetch order details
async function fetchOrderDetails(orderId) {
  const orderDetails = document.getElementById(`order-details-${orderId}`);
  if (!orderDetails) return;
  
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    const order = await response.json();
    
    if (!order.items || order.items.length === 0) {
      orderDetails.innerHTML = '<div style="text-align: center; padding: 20px;">Detail pesanan tidak tersedia</div>';
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
    
    // Generate items table
    let itemsHTML = `
      <div class="order-customer">
        <p><strong>Nama:</strong> ${order.nama_pelanggan}</p>
        <p><strong>Alamat:</strong> ${order.alamat}</p>
        <p><strong>Telepon:</strong> ${order.telepon}</p>
        <p><strong>Metode Pembayaran:</strong> ${order.metode_pembayaran}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${order.status.toUpperCase()}</span></p>
        <div style="margin-top: 15px;">
          <label style="color: gold; display: block; margin-bottom: 5px;">Update Status:</label>
          <select onchange="updateOrderStatus(${orderId}, this.value)" style="padding: 8px; border-radius: 5px; background: rgba(255,255,255,0.1); color: white; border: 1px solid gold;">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="proses" ${order.status === 'proses' ? 'selected' : ''}>Proses</option>
            <option value="kirim" ${order.status === 'kirim' ? 'selected' : ''}>Kirim</option>
            <option value="selesai" ${order.status === 'selesai' ? 'selected' : ''}>Selesai</option>
          </select>
        </div>
      </div>
      <table class="order-items-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Produk</th>
            <th>Harga</th>
            <th>Jumlah</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    order.items.forEach((item, index) => {
      itemsHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.nama_produk}</td>
          <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
          <td>${item.jumlah}</td>
          <td>Rp ${item.subtotal.toLocaleString('id-ID')}</td>
        </tr>
      `;
    });
    
    itemsHTML += `
        </tbody>
      </table>
    `;
    
    orderDetails.innerHTML = itemsHTML;
    
  } catch (error) {
    console.error('Error fetching order details:', error);
    orderDetails.innerHTML = '<div style="text-align: center; padding: 20px;">Gagal memuat detail pesanan</div>';
  }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('Status pesanan berhasil diupdate!');
      // Refresh order details to show new status
      await fetchOrderDetails(orderId);
    } else {
      showNotification('Gagal mengupdate status pesanan!');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    showNotification('Terjadi kesalahan saat mengupdate status!');
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
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

// Load all data when dashboard is shown
function loadDashboardData() {
  fetchTransactionsSummary();
  fetchTransactions();
  filterOrdersByStatus('all');
  fetchTopItems();
}

// ============ NAVIGATION FUNCTIONS ============

/**
 * Show specific section and hide others
 * @param {string} sectionName - Name of section to show (overview, reports, orders)
 */
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.style.display = 'none';
  });

  // Show target section
  const targetSection = document.getElementById(`${sectionName}-section`);
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  // Update navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'rgba(255, 255, 255, 0.1)';
    btn.style.color = 'gold';
    btn.style.border = '1px solid gold';
  });

  // Find and activate the clicked button
  const activeBtn = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.background = 'gold';
    activeBtn.style.color = 'black';
    activeBtn.style.border = 'none';
  }

  // Load data for specific section
  if (sectionName === 'reports') {
    // Set default date range to current month
    setDefaultDateRange();
  }
}

// ============ REPORT FUNCTIONS ============

/**
 * Set default date range (current month)
 */
function setDefaultDateRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  document.getElementById('filterStartDate').value = firstDay.toISOString().split('T')[0];
  document.getElementById('filterEndDate').value = lastDay.toISOString().split('T')[0];
}

/**
 * Filter transactions by date range
 */
async function filterByDate() {
  const startDate = document.getElementById('filterStartDate').value;
  const endDate = document.getElementById('filterEndDate').value;

  if (!startDate || !endDate) {
    showNotification('Silakan pilih tanggal awal dan akhir!', 'error');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showNotification('Tanggal awal tidak boleh lebih besar dari tanggal akhir!', 'error');
    return;
  }

  try {
    showNotification('Memuat data...', 'info');

    const response = await fetch(`/api/transactions?start_date=${startDate}&end_date=${endDate}`);
    const data = await response.json();

    filteredTransactions = data;
    updateReportTable(filteredTransactions);
    updateReportSummary(filteredTransactions);

    showNotification(`Ditemukan ${filteredTransactions.length} transaksi`, 'success');
  } catch (error) {
    console.error('Error filtering transactions:', error);
    showNotification('Gagal memfilter transaksi!', 'error');
  }
}

/**
 * Reset date filter and show all transactions
 */
function resetDateFilter() {
  document.getElementById('filterStartDate').value = '';
  document.getElementById('filterEndDate').value = '';

  filteredTransactions = [];
  document.getElementById('report-table-body').innerHTML = `
    <tr>
      <td colspan="11" class="empty-message">
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
          <div style="color: gold;">Silakan pilih filter tanggal untuk melihat laporan</div>
        </div>
      </td>
    </tr>
  `;

  // Reset summary cards
  document.getElementById('summary-transaksi').textContent = '0';
  document.getElementById('summary-barang').textContent = '0';
  document.getElementById('summary-penjualan').textContent = 'Rp 0';
  document.getElementById('summary-modal').textContent = 'Rp 0';
  document.getElementById('summary-profit').textContent = 'Rp 0';

  showNotification('Filter telah direset', 'info');
}

/**
 * Quick filter by preset periods
 * @param {string} period - Period type (today, week, month, year)
 */
function quickFilter(period) {
  const today = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = today;
      endDate = today;
      break;
    case 'week':
      const dayOfWeek = today.getDay();
      startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek);
      endDate = today;
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
  }

  document.getElementById('filterStartDate').value = startDate.toISOString().split('T')[0];
  document.getElementById('filterEndDate').value = endDate.toISOString().split('T')[0];

  filterByDate();
}

/**
 * Update report table with filtered data
 * @param {Array} transactions - Array of filtered transactions
 */
function updateReportTable(transactions) {
  const tableBody = document.getElementById('report-table-body');

  if (!transactions || transactions.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; color: gold;">Tidak ada transaksi untuk periode ini</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';

  transactions.forEach((t, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${t.tanggal || ''}</td>
      <td>${t.konsumen || ''}</td>
      <td>${t.nota || ''}</td>
      <td>${t.barang || ''}</td>
      <td>${t.qty !== null ? t.qty : ''}</td>
      <td>${t.kulak !== null ? t.kulak : ''}</td>
      <td>${t.jual !== null ? t.jual : ''}</td>
      <td>${t.total_kulak !== null ? t.total_kulak : ''}</td>
      <td>${t.total_jual !== null ? t.total_jual : ''}</td>
      <td>${t.profit !== null ? t.profit : ''}</td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Update report summary cards
 * @param {Array} transactions - Array of filtered transactions
 */
function updateReportSummary(transactions) {
  if (!transactions || transactions.length === 0) {
    document.getElementById('summary-transaksi').textContent = '0';
    document.getElementById('summary-barang').textContent = '0';
    document.getElementById('summary-penjualan').textContent = 'Rp 0';
    document.getElementById('summary-modal').textContent = 'Rp 0';
    document.getElementById('summary-profit').textContent = 'Rp 0';
    return;
  }

  // Calculate summary
  const totalTransaksi = transactions.length;
  const totalBarang = transactions.reduce((sum, t) => sum + (t.qty || 0), 0);
  const totalPenjualan = transactions.reduce((sum, t) => sum + (t.total_jual || 0), 0);
  const totalModal = transactions.reduce((sum, t) => sum + (t.total_kulak || 0), 0);
  const totalProfit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);

  document.getElementById('summary-transaksi').textContent = totalTransaksi;
  document.getElementById('summary-barang').textContent = totalBarang.toFixed(1);
  document.getElementById('summary-penjualan').textContent = `Rp ${totalPenjualan.toLocaleString('id-ID')}`;
  document.getElementById('summary-modal').textContent = `Rp ${totalModal.toLocaleString('id-ID')}`;
  document.getElementById('summary-profit').textContent = `Rp ${totalProfit.toLocaleString('id-ID')}`;
}

/**
 * Export report to Excel
 */
function exportReportToExcel() {
  if (!filteredTransactions || filteredTransactions.length === 0) {
    showNotification('Tidak ada data untuk diexport. Silakan filter terlebih dahulu!', 'error');
    return;
  }

  const startDate = document.getElementById('filterStartDate').value;
  const endDate = document.getElementById('filterEndDate').value;

  const exportRows = filteredTransactions.map((t, index) => ({
    No: index + 1,
    Tanggal: t.tanggal || '',
    Konsumen: t.konsumen || '',
    Nota: t.nota || '',
    Barang: t.barang || '',
    Qty: t.qty ?? '',
    Kulak: t.kulak ?? '',
    Jual: t.jual ?? '',
    TotalKulak: t.total_kulak ?? '',
    TotalJual: t.total_jual ?? '',
    Profit: t.profit ?? ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Transaksi');

  const filename = `laporan-transaksi-${startDate}-sampai-${endDate}.xlsx`;
  XLSX.writeFile(workbook, filename);

  showNotification(`Laporan berhasil diexport: ${filename}`, 'success');
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  const colors = {
    success: '#32C03C',
    error: '#ff0000',
    info: '#32C03C'
  };

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.success};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 3000;
    animation: slideIn 0.3s ease;
    max-width: 400px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Ensure inline onclick handlers always resolve on window.
window.filterOrdersByStatus = filterOrdersByStatus;
window.exportToExcel = exportToExcel;
window.login = login;
window.showSection = showSection;
window.filterByDate = filterByDate;
window.resetDateFilter = resetDateFilter;
window.quickFilter = quickFilter;
window.exportReportToExcel = exportReportToExcel;
