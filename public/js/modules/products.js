/**
 * Products Module
 * 
 * Menangani semua operasi terkait produk:
 * - Load produk dari API
 * - Display produk di grid
 * - Load varian produk
 * - Render tabs produk
 */

/**
 * Load products from API
 * @param {string} category - Kategori filter (default: 'all')
 */
async function loadProducts(category = 'all') {
  try {
    const response = await fetch(`/api/products${category !== 'all' ? `?category=${category}` : ''}`);
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

/**
 * Display products in grid
 * @param {Array} products - Array produk yang akan ditampilkan
 */
function displayProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';
    card.onclick = () => {
      // Determine which tab to open based on product name
      let tabName = 'all';
      if (product.name.includes('K.1 PREMIUM')) {
        tabName = 'k1';
      } else if (product.name.includes('K.2 SHAFON')) {
        tabName = 'k2';
      } else if (product.name.includes('K.3 TITAN')) {
        tabName = 'k3';
      } else if (product.name.includes('K.4 ELEPHANT')) {
        tabName = 'k4';
      }
      // Open modal with specific tab
      openModal(tabName);
    };
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h4>${product.name}</h4>
      <div class="price">${formatCurrency(product.price)} / lembar</div>
      <div class="specs">${product.specs}</div>
    `;
    grid.appendChild(card);
  });
}

/**
 * Load all variants for dynamic modal tabs
 */
async function loadAllProductVariants() {
  try {
    const [variantResponse, otherProductsResponse] = await Promise.all([
      fetch('/api/products/variants'),
      fetch('/api/products?category=other')
    ]);

    const variants = await variantResponse.json();
    const otherProducts = await otherProductsResponse.json();
    renderProductTabs(variants, otherProducts);
  } catch (error) {
    console.error('Error loading product variants:', error);
  }
}

/**
 * Render variant cards di modal
 * @param {string} targetTabId - ID tab target
 * @param {Array} variants - Array varian produk
 */
function renderVariantCards(targetTabId, variants) {
  const tab = document.getElementById(targetTabId);
  if (!tab) return;
  const modalGrid = tab.querySelector('.modal-grid');
  if (!modalGrid) return;

  if (!variants || variants.length === 0) {
    modalGrid.innerHTML = '<div style="color:#666;">Belum ada data produk.</div>';
    return;
  }

  modalGrid.innerHTML = variants.map((variant) => {
    const safeName = String(variant.nama_varian || '').replace(/'/g, "\\'");
    const safeImage = String(variant.image || '').replace(/'/g, "\\'");
    const imagePath = variant.image || '../images/logo.jpg';
    const price = Number(variant.harga) || 0;
    const specs = variant.specs || '-';

    // Check if item is in cart
    const cartItem = cart.find(item => item.title === variant.nama_varian);
    const qty = cartItem ? cartItem.quantity : 0;

    // Generate button HTML based on cart state
    let buttonHTML;
    if (qty > 0) {
      // Item in cart - show quantity controls
      buttonHTML = `
        <div class="quantity-controls">
          <button class="qty-btn-minus" onclick="updateQuantityInModal('${safeName}', -1, ${price}, '${safeImage}')">-</button>
          <span class="qty-display">${qty}</span>
          <button class="qty-btn-plus" onclick="updateQuantityInModal('${safeName}', 1, ${price}, '${safeImage}')">+</button>
        </div>
      `;
    } else {
      // Item not in cart - show add button
      buttonHTML = `<button class="add-to-cart-btn" onclick="addToCartFromModal('${safeName}', ${price}, '${safeImage}')">+ Tambah ke Keranjang</button>`;
    }

    return `
      <div class="modal-card" data-product-name="${safeName}">
        <img src="${imagePath}" alt="${variant.nama_varian || 'Produk'}">
        <h4>${variant.nama_varian || 'Produk'}</h4>
        <div class="price">${formatCurrency(price)} / lembar</div>
        <div class="specs">${specs}</div>
        ${buttonHTML}
      </div>
    `;
  }).join('');
}

/**
 * Render product tabs di modal
 * @param {Array} variants - Array varian produk
 * @param {Array} otherProducts - Array produk lain (category: other)
 */
function renderProductTabs(variants, otherProducts) {
  const allVariants = variants || [];

  const normalizedOtherProducts = (otherProducts || []).map((product) => ({
    category: product.category || 'other',
    nama_varian: product.name,
    harga: Number(product.price) || 0,
    specs: product.specs || '',
    image: product.image || ''
  }));

  // "All Products" = semua varian + produk category other dari tabel products.
  const mergedAllProducts = [...allVariants];
  const existingNames = new Set(
    allVariants.map((item) => String(item.nama_varian || '').trim().toLowerCase())
  );

  normalizedOtherProducts.forEach((item) => {
    const key = String(item.nama_varian || '').trim().toLowerCase();
    if (!existingNames.has(key)) {
      mergedAllProducts.push(item);
    }
  });

  renderVariantCards('all', mergedAllProducts);
  renderVariantCards('k1', allVariants.filter((item) => item.category === 'k1'));
  renderVariantCards('k2', allVariants.filter((item) => item.category === 'k2'));
  renderVariantCards('k3', allVariants.filter((item) => item.category === 'k3'));
  renderVariantCards('k4', allVariants.filter((item) => item.category === 'k4'));
}

/**
 * Add to cart from modal and refresh modal buttons
 * @param {string} title - Nama produk
 * @param {number} price - Harga produk
 * @param {string} image - Path gambar produk
 */
function addToCartFromModal(title, price, image) {
  addToCart(title, price, image);
  // Refresh all modal buttons to show quantity controls
  refreshModalButtons();
}

/**
 * Update quantity from modal and refresh modal buttons
 * @param {string} title - Nama produk
 * @param {number} change - Perubahan quantity (+1 atau -1)
 * @param {number} price - Harga produk
 * @param {string} image - Path gambar produk
 */
function updateQuantityInModal(title, change, price, image) {
  const cartItem = cart.find(item => item.title === title);

  if (cartItem) {
    cartItem.quantity += change;

    if (cartItem.quantity <= 0) {
      // Remove from cart if quantity is 0
      removeFromCart(title);
    } else {
      // Save and update cart
      saveCart();
      renderCart();
      updateCartCount();
    }

    // Refresh modal buttons
    refreshModalButtons();
  }
}

/**
 * Refresh all modal buttons to reflect current cart state
 */
async function refreshModalButtons() {
  // Store current active tab
  let activeTabId = null;
  const tabs = ['k1', 'k2', 'k3', 'k4', 'all'];

  tabs.forEach(tabId => {
    const tab = document.getElementById(tabId);
    if (tab && tab.classList.contains('active')) {
      activeTabId = tabId;
    }
  });

  // Reload all variants to refresh buttons
  await loadAllProductVariants();

  // Restore active tab if needed
  if (activeTabId) {
    const tab = document.getElementById(activeTabId);
    if (tab) {
      tab.classList.add('active');
    }
  }
}