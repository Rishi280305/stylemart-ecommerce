/* ============================================================
   MAIN.JS — Loaded on every page. Holds the things every page
   needs: the Cart storage API, toast notifications, and the
   shared navbar behaviour (hamburger, search, cart badge).
   ============================================================ */

const CART_STORAGE_KEY = 'ecom_cart';

/* ---------- Cart storage (LocalStorage) ----------
   The cart is just an array of items saved as JSON text under one
   LocalStorage key. Every function below reads that key, changes
   the array in memory, then writes it back — so the cart survives
   a page refresh without any server involved. */
const Cart = {
  getItems() {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Cart data was corrupted, resetting cart.', err);
      return [];
    }
  },

  save(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    updateCartBadge();
  },

  addItem(product, qty = 1) {
    const items = this.getItems();
    const existing = items.find((item) => item.id === product.id);

    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        qty,
      });
    }
    this.save(items);
  },

  updateQty(id, qty) {
    let items = this.getItems();
    if (qty <= 0) {
      items = items.filter((item) => item.id !== id);
    } else {
      const item = items.find((item) => item.id === id);
      if (item) item.qty = qty;
    }
    this.save(items);
  },

  removeItem(id) {
    const items = this.getItems().filter((item) => item.id !== id);
    this.save(items);
  },

  clear() {
    this.save([]);
  },

  getItemCount() {
    return this.getItems().reduce((total, item) => total + item.qty, 0);
  },

  getSubtotal() {
    return this.getItems().reduce((total, item) => total + item.price * item.qty, 0);
  },
};

/* ---------- Small formatting helpers ---------- */
function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderStars(rating) {
  const full = Math.round(rating || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

/* ---------- Toast notifications ---------- */
function showToast(message, type = 'default') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }

  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' toast-error' : ''}${type === 'success' ? ' toast-success' : ''}`;
  toast.textContent = message;
  stack.appendChild(toast);

  setTimeout(() => toast.remove(), 2600);
}

/* ---------- Cart badge (the little number on the cart icon) ---------- */
function updateCartBadge() {
  const badge = document.querySelector('.cart-count');
  if (badge) badge.textContent = Cart.getItemCount();
}

/* ---------- Navbar: hamburger menu + mobile search toggle ---------- */
function initNavbar() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navSearch = document.querySelector('.nav-search');

  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
    navSearch?.classList.remove('open');
  });

  const searchToggle = document.querySelector('.search-toggle');
  searchToggle?.addEventListener('click', () => {
    navSearch?.classList.toggle('open');
    navLinks?.classList.remove('open');
  });

  // Submitting the navbar search sends the user to the products
  // page with the query in the URL, e.g. products.html?search=shoes
  const searchForm = document.querySelector('.nav-search');
  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = searchForm.querySelector('input');
    const query = input.value.trim();
    window.location.href = query
      ? `products.html?search=${encodeURIComponent(query)}`
      : 'products.html';
  });

  // Highlight whichever nav link matches the current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((link) => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  updateCartBadge();
  const yearEl = document.querySelector('#footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
