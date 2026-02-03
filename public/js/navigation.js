/**
 * Mobile navigation toggle functionality
 * Called from HTML onclick attributes
 */
// eslint-disable-next-line no-unused-vars
function toggleNav() {
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) {
    mobileNav.classList.toggle('hidden');
  }
}
