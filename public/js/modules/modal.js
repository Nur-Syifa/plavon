/**
 * Modal Module
 * 
 * Menangani semua operasi terkait modal:
 * - Open/close produk modal
 * - Tab switching di produk modal
 * - Event listeners untuk modal
 */

/**
 * Open produk modal dengan tab tertentu
 * @param {string} tabName - Nama tab yang akan dibuka (all, k1, k2, k3, k4)
 */
function openModal(tabName) {
  const modal = document.getElementById("productsModal");
  modal.style.display = "flex";
  openTab(tabName);
  // Refresh modal buttons to show current cart state
  refreshModalButtons();
}

/**
 * Close produk modal
 */
function closeModal() {
  const modal = document.getElementById("productsModal");
  modal.style.display = "none";
}

/**
 * Open tab tertentu di produk modal
 * @param {string} tabName - Nama tab yang akan dibuka
 */
function openTab(tabName) {
  const tabcontent = document.getElementsByClassName("tab-content");
  const tabbuttons = document.getElementsByClassName("tab-button");
  
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  for (let i = 0; i < tabbuttons.length; i++) {
    tabbuttons[i].className = tabbuttons[i].className.replace(" active", "");
  }
  
  const tabElement = document.getElementById(tabName);
  if (tabElement) {
    tabElement.style.display = "block";
  }
  
  const activeButton = document.querySelector(`[onclick="openTab('${tabName}')"]`);
  if (activeButton) {
    activeButton.className += " active";
  }
}

/**
 * Setup event listeners untuk modal
 */
function setupModalEventListeners() {
  // Event listener untuk click outside modal
  document.addEventListener('click', function(event) {
    const modal = document.getElementById("productsModal");
    const closeBtn = document.querySelector(".close");
    
    if (event.target === modal) {
      closeModal();
    }
    
    if (event.target === closeBtn) {
      closeModal();
    }
  });
}

// Initialize modal event listeners
setupModalEventListeners();