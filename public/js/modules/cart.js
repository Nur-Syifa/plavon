/**
 * Shopping Cart Module
 * 
 * Menangani semua operasi terkait keranjang belanja:
 * - Menambah item ke keranjang
 * - Menghapus item dari keranjang
 * - Update quantity item
 * - Render keranjang
 * - Menyimpan keranjang ke localStorage
 */

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

/**
 * Toggle cart sidebar
 */
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

/**
 * Add item to cart
 * @param {string} title - Nama produk
 * @param {number} price - Harga produk
 * @param {string} image - Path gambar produk
 */
function addToCart(title, price, image) {
  const existingItem = cart.find(item => item.title === title);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      title: title,
      price: price,
      image: image,
      quantity: 1
    });
  }
  
  saveCart();
  renderCart();
  updateCartCount();
  
  // Show notification
  showNotification('Produk berhasil ditambahkan ke keranjang!');
}

/**
 * Remove item from cart
 * @param {string} title - Nama produk yang akan dihapus
 */
function removeFromCart(title) {
  cart = cart.filter(item => item.title !== title);
  saveCart();
  renderCart();
  updateCartCount();
}

/**
 * Update item quantity
 * @param {string} title - Nama produk
 * @param {number} change - Perubahan quantity (positif/negatif)
 */
function updateQuantity(title, change) {
  const item = cart.find(item => item.title === title);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(title);
    } else {
      saveCart();
      renderCart();
      updateCartCount();
    }
  }
}

/**
 * Save cart to localStorage
 */
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

/**
 * Render cart items di sidebar
 */
function renderCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalElement = document.getElementById('cartTotal');
  
  if (!cartItemsContainer || !cartTotalElement) return;
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <svg viewBox="0 0 24 24">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
        <p>Keranjang belanja Anda kosong</p>
      </div>
    `;
    cartTotalElement.textContent = 'Rp 0';
    return;
  }

  let cartHTML = '';
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    cartHTML += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">${formatCurrency(item.price)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateQuantity('${item.title}', -1)">-</button>
          <span class="cart-item-qty">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity('${item.title}', 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart('${item.title}')">Hapus</button>
        </div>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = cartHTML;
  cartTotalElement.textContent = formatCurrency(total);
}

/**
 * Update cart count badge
 */
function updateCartCount() {
  const cartCount = document.getElementById('cartCount');
  if (!cartCount) return;
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

/**
 * Get cart total
 * @returns {number} - Total harga keranjang
 */
function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Clear cart
 */
function clearCart() {
  cart = [];
  saveCart();
  renderCart();
  updateCartCount();
}