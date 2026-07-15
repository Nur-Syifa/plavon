/**
 * Slideshow Module
 * 
 * Menangani slideshow testimoni:
 * - Auto-advance slides
 * - Manual slide navigation
 * - Dot indicators
 */

let slideIndex = 1;
let slideInterval;

/**
 * Setup slideshow dengan auto-advance
 */
function setupSlideshow() {
  showSlides(slideIndex);
  
  // Auto-advance slides setiap 5 detik
  slideInterval = setInterval(() => {
    slideIndex++;
    showSlides(slideIndex);
  }, 5000);
}

/**
 * Change slide dengan navigasi manual
 * @param {number} n - Jumlah slide yang akan digeser
 */
function changeSlide(n) {
  slideIndex += n;
  showSlides(slideIndex);
}

/**
 * Go to specific slide
 * @param {number} n - Index slide yang dituju
 */
function currentSlide(n) {
  slideIndex = n;
  showSlides(slideIndex);
}

/**
 * Show slide tertentu
 * @param {number} n - Index slide yang akan ditampilkan
 */
function showSlides(n) {
  const slides = document.getElementsByClassName("slide");
  const dots = document.getElementsByClassName("dot");
  
  if (slides.length === 0) return;
  
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (let i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active-dot", "");
  }
  
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active-dot";
}