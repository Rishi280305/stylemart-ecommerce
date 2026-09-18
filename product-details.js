/* ============================================================
   PRODUCT-DETAILS.JS — Runs only on product-details.html.
   The product id travels between pages as a URL parameter
   (?id=7), which is how this page knows which product to fetch.
   ============================================================ */

let currentProduct = null;
let selectedQty = 1;

const contentEl = document.querySelector('#pd-content');
const stateEl = document.querySelector('#pd-state');

async function initProductDetailsPage() {
  const id = new URLSearchParams(window.location.search).get('id');
  renderLoadingSkeleton();

  if (!id) {
    renderError('No product was specified.');
    return;
  }

  try {
    currentProduct = await getProductById(id);
    if (!currentProduct || !currentProduct.id) throw new Error('Not found');
    renderProduct(currentProduct);
  } catch (err) {
    console.error(err);
    renderError("We couldn't find that product. It may have been removed.");
  }
}

function renderProduct(product) {
  document.title = `${product.title} — StyleMart`;

  stateEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  document.querySelector('#pd-breadcrumb-title').textContent = product.title;
  document.querySelector('#pd-image').src = product.image;
  document.querySelector('#pd-image').alt = product.title;
  document.querySelector('#pd-category').textContent = product.category;
  document.querySelector('#pd-title').textContent = product.title;
  document.querySelector('#pd-stars').textContent = renderStars(product.rating?.rate);
  document.querySelector('#pd-rating-count').textContent = `${product.rating?.rate ?? '—'} (${product.rating?.count ?? 0} reviews)`;
  document.querySelector('#pd-price').textContent = formatPrice(product.price);
  document.querySelector('#pd-desc').textContent = product.description;
  document.querySelector('#pd-meta-category').textContent = product.category;
  document.querySelector('#pd-meta-id').textContent = `#${product.id}`;
}

function renderLoadingSkeleton() {
  contentEl.classList.add('hidden');
  stateEl.classList.remove('hidden');
  stateEl.innerHTML = `
    <div class="pd-layout">
      <div class="skeleton-media"></div>
      <div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>`;
}

function renderError(message) {
  contentEl.classList.add('hidden');
  stateEl.classList.remove('hidden');
  stateEl.innerHTML = `
    <div class="state-block">
      <div class="state-icon">⚠️</div>
      <h3>Product unavailable</h3>
      <p>${message}</p>
      <a href="products.html" class="btn btn-primary">Back to products</a>
    </div>`;
}

/* ---------- Quantity selector ---------- */
const qtyInput = document.querySelector('#pd-qty');

document.querySelector('#pd-qty-minus')?.addEventListener('click', () => {
  selectedQty = Math.max(1, selectedQty - 1);
  qtyInput.value = selectedQty;
});

document.querySelector('#pd-qty-plus')?.addEventListener('click', () => {
  selectedQty += 1;
  qtyInput.value = selectedQty;
});

qtyInput?.addEventListener('change', () => {
  const value = Math.max(1, parseInt(qtyInput.value, 10) || 1);
  selectedQty = value;
  qtyInput.value = value;
});

/* ---------- Add to cart ---------- */
document.querySelector('#pd-add-cart')?.addEventListener('click', () => {
  if (!currentProduct) return;
  Cart.addItem(currentProduct, selectedQty);
  showToast(`Added ${selectedQty} × "${currentProduct.title.slice(0, 24)}" to cart`, 'success');
});

document.addEventListener('DOMContentLoaded', initProductDetailsPage);
