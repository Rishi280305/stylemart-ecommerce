/* ============================================================
   CART.JS — Runs only on cart.html.
   Reads/writes the cart through the shared Cart object (main.js)
   so this page and the navbar badge always agree with each other.
   ============================================================ */

const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

const cartListEl = document.querySelector('#cart-list');
const cartLayoutEl = document.querySelector('#cart-layout');
const cartEmptyEl = document.querySelector('#cart-empty');

function renderCart() {
  const items = Cart.getItems();

  if (items.length === 0) {
    cartLayoutEl.classList.add('hidden');
    cartEmptyEl.classList.remove('hidden');
    return;
  }

  cartLayoutEl.classList.remove('hidden');
  cartEmptyEl.classList.add('hidden');

  cartListEl.innerHTML = items.map(cartItemHTML).join('');
  renderSummary(items);
}

function cartItemHTML(item) {
  const subtotal = item.price * item.qty;
  return `
    <div class="cart-item" data-id="${item.id}">
      <a href="product-details.html?id=${item.id}" class="cart-item-media">
        <img src="${item.image}" alt="${item.title}">
      </a>
      <div class="cart-item-title-block">
        <a href="product-details.html?id=${item.id}" class="cart-item-title">${item.title}</a>
        <div class="cart-item-cat">${item.category}</div>
      </div>
      <div class="cart-item-price">${formatPrice(item.price)}</div>
      <div class="cart-item-qty qty-control">
        <button class="qty-minus" aria-label="Decrease quantity">−</button>
        <input type="number" min="1" value="${item.qty}" class="qty-input">
        <button class="qty-plus" aria-label="Increase quantity">+</button>
      </div>
      <div class="cart-item-subtotal">${formatPrice(subtotal)}</div>
      <button class="cart-item-remove">Remove</button>
    </div>
  `;
}

function renderSummary(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  document.querySelector('#summary-subtotal').textContent = formatPrice(subtotal);
  document.querySelector('#summary-shipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
  document.querySelector('#summary-total').textContent = formatPrice(total);

  const note = document.querySelector('#free-ship-note');
  if (subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD) {
    note.textContent = `Add ${formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping`;
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }
}

/* ---------- Event delegation for quantity/remove controls ---------- */
cartListEl?.addEventListener('click', (event) => {
  const row = event.target.closest('.cart-item');
  if (!row) return;
  const id = Number(row.dataset.id);

  if (event.target.closest('.qty-minus')) {
    const current = Cart.getItems().find((i) => i.id === id);
    if (current) Cart.updateQty(id, current.qty - 1);
    renderCart();
  }

  if (event.target.closest('.qty-plus')) {
    const current = Cart.getItems().find((i) => i.id === id);
    if (current) Cart.updateQty(id, current.qty + 1);
    renderCart();
  }

  if (event.target.closest('.cart-item-remove')) {
    Cart.removeItem(id);
    showToast('Item removed from cart');
    renderCart();
  }
});

cartListEl?.addEventListener('change', (event) => {
  if (!event.target.classList.contains('qty-input')) return;
  const row = event.target.closest('.cart-item');
  const id = Number(row.dataset.id);
  const qty = Math.max(1, parseInt(event.target.value, 10) || 1);
  Cart.updateQty(id, qty);
  renderCart();
});

document.addEventListener('DOMContentLoaded', renderCart);
