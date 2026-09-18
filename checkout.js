/* ============================================================
   CHECKOUT.JS — Runs only on checkout.html.
   No real payment happens here — this validates the form, then
   "places" the order by saving a summary to LocalStorage and
   clearing the cart, so the flow feels complete end to end.
   ============================================================ */

const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;
const ORDERS_KEY = 'ecom_orders';

const form = document.querySelector('#checkout-form');
const orderListEl = document.querySelector('#order-summary-list');

const validators = {
  fullName: (v) => v.trim().length >= 2 || 'Enter your full name.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address.',
  phone: (v) => /^\d{10}$/.test(v.replace(/\D/g, '')) || 'Enter a 10-digit phone number.',
  address: (v) => v.trim().length >= 5 || 'Enter your street address.',
  city: (v) => v.trim().length >= 2 || 'Enter your city.',
  state: (v) => v.trim().length >= 2 || 'Enter your state.',
  pincode: (v) => /^\d{5,6}$/.test(v.trim()) || 'Enter a valid pincode.',
};

function renderOrderSummary() {
  const items = Cart.getItems();

  if (items.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  const subtotal = Cart.getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  orderListEl.innerHTML = items
    .map(
      (item) => `
      <div class="order-summary-item">
        <span>${item.title.slice(0, 34)}${item.title.length > 34 ? '…' : ''} × ${item.qty}</span>
        <span>${formatPrice(item.price * item.qty)}</span>
      </div>`
    )
    .join('');

  document.querySelector('#co-subtotal').textContent = formatPrice(subtotal);
  document.querySelector('#co-shipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
  document.querySelector('#co-total').textContent = formatPrice(total);
}

/* ---------- Field-level validation ---------- */
function validateField(field) {
  const rule = validators[field.name];
  if (!rule) return true;

  const result = rule(field.value);
  const wrapper = field.closest('.form-field');
  const errorEl = wrapper.querySelector('.field-error');

  if (result === true) {
    wrapper.classList.remove('error');
    errorEl.textContent = '';
    return true;
  }

  wrapper.classList.add('error');
  errorEl.textContent = result;
  return false;
}

function validateForm() {
  let isValid = true;
  form.querySelectorAll('input[name]').forEach((field) => {
    if (validators[field.name] && !validateField(field)) isValid = false;
  });
  return isValid;
}

/* Validate a field as soon as the user leaves it, so errors show
   up early rather than only after a failed submit. */
form?.querySelectorAll('input[name]').forEach((field) => {
  field.addEventListener('blur', () => validateField(field));
});

/* ---------- Submit ---------- */
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateForm()) {
    showToast('Please fix the highlighted fields', 'error');
    return;
  }
  placeOrder();
});

function placeOrder() {
  const formData = new FormData(form);
  const items = Cart.getItems();
  const subtotal = Cart.getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  const order = {
    orderId: `ORD-${Date.now().toString().slice(-8)}`,
    placedAt: new Date().toISOString(),
    customer: {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      pincode: formData.get('pincode'),
    },
    paymentMethod: formData.get('paymentMethod'),
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
  };

  saveOrder(order);
  Cart.clear();
  showSuccessModal(order);
}

function saveOrder(order) {
  const existing = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  existing.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(existing));
}

function showSuccessModal(order) {
  const overlay = document.querySelector('#success-modal');
  document.querySelector('#success-order-id').textContent = order.orderId;
  overlay.classList.remove('hidden');
}

document.querySelector('#success-continue-btn')?.addEventListener('click', () => {
  window.location.href = 'index.html';
});

document.addEventListener('DOMContentLoaded', renderOrderSummary);
