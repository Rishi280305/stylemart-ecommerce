/* ============================================================
   PRODUCTS.JS — Runs only on products.html.
   Fetches the catalog once, then does all searching/filtering/
   sorting in memory against that one copy, so switching a filter
   never re-hits the network.
   ============================================================ */

let allProducts = [];   // full catalog, fetched once
let currentView = [];   // filtered + sorted subset currently shown

const grid = document.querySelector('#product-grid');
const stateBlock = document.querySelector('#state-block');
const toolbarCount = document.querySelector('#toolbar-count');
const categorySelect = document.querySelector('#filter-category');
const sortSelect = document.querySelector('#sort-select');
const searchInput = document.querySelector('#toolbar-search');

async function initProductsPage() {
  renderSkeletons();

  try {
    const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
    allProducts = products;
    populateCategoryFilter(categories);
    applyUrlParamsToControls();
    applyFilters();
  } catch (err) {
    console.error(err);
    renderErrorState();
  }
}

/* ---------- Reading the URL (so links like index.html can deep-link here) ---------- */
function applyUrlParamsToControls() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search');
  const category = params.get('category');

  if (search) searchInput.value = search;
  if (category) categorySelect.value = category;
}

function populateCategoryFilter(categories) {
  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

/* ---------- Core: filter + sort + render ---------- */
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  const sortBy = sortSelect.value;

  let result = allProducts.filter((product) => {
    const matchesQuery = !query || product.title.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || product.category === category;
    return matchesQuery && matchesCategory;
  });

  result = sortProducts(result, sortBy);

  currentView = result;
  renderProducts(result);
}

function sortProducts(products, sortBy) {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating-desc':
      return sorted.sort((a, b) => b.rating.rate - a.rating.rate);
    default:
      return sorted; // 'featured' — API's original order
  }
}

/* ---------- Rendering ---------- */
function renderProducts(products) {
  toolbarCount.textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;

  if (products.length === 0) {
    grid.innerHTML = '';
    renderEmptyState();
    return;
  }

  stateBlock.classList.add('hidden');
  grid.classList.remove('hidden');

  grid.innerHTML = products.map(productCardHTML).join('');
}

function productCardHTML(product) {
  return `
    <article class="product-card" data-id="${product.id}">
      <a href="product-details.html?id=${product.id}" class="product-card-media">
        <img src="${product.image}" alt="${escapeHtml(product.title)}" loading="lazy">
      </a>
      <div class="product-card-body">
        <span class="product-category">${product.category}</span>
        <a href="product-details.html?id=${product.id}" class="product-title">${escapeHtml(product.title)}</a>
        <div class="product-rating">
          <span class="stars">${renderStars(product.rating?.rate)}</span>
          <span>(${product.rating?.count ?? 0})</span>
        </div>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(product.price)}</span>
        </div>
      </div>
      <div class="product-card-actions">
        <button class="btn btn-secondary btn-view" data-id="${product.id}">View</button>
        <button class="btn btn-primary btn-add-cart" data-id="${product.id}">Add to cart</button>
      </div>
    </article>
  `;
}

function renderSkeletons() {
  stateBlock.classList.add('hidden');
  grid.classList.remove('hidden');
  grid.innerHTML = Array.from({ length: 8 })
    .map(
      () => `
      <div class="skeleton-card">
        <div class="skeleton-media"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>`
    )
    .join('');
}

function renderEmptyState() {
  grid.classList.add('hidden');
  stateBlock.classList.remove('hidden');
  stateBlock.innerHTML = `
    <div class="state-block">
      <div class="state-icon">🔍</div>
      <h3>No products match</h3>
      <p>Try a different search term or clear your filters.</p>
      <button class="btn btn-secondary" id="clear-filters-btn">Clear filters</button>
    </div>`;
  document.querySelector('#clear-filters-btn')?.addEventListener('click', clearFilters);
}

function renderErrorState() {
  grid.classList.add('hidden');
  stateBlock.classList.remove('hidden');
  stateBlock.innerHTML = `
    <div class="state-block">
      <div class="state-icon">⚠️</div>
      <h3>Couldn't load products</h3>
      <p>Something went wrong reaching the product catalog. Check your connection and try again.</p>
      <button class="btn btn-primary" id="retry-btn">Retry</button>
    </div>`;
  document.querySelector('#retry-btn')?.addEventListener('click', initProductsPage);
}

function clearFilters() {
  searchInput.value = '';
  categorySelect.value = 'all';
  sortSelect.value = 'featured';
  applyFilters();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Event delegation ----------
   One listener on the grid handles clicks for every card, even
   cards that get re-rendered later — no need to re-attach
   listeners each time renderProducts() runs. */
grid?.addEventListener('click', (event) => {
  const addBtn = event.target.closest('.btn-add-cart');
  if (addBtn) {
    event.preventDefault();
    const product = allProducts.find((p) => p.id === Number(addBtn.dataset.id));
    if (product) {
      Cart.addItem(product, 1);
      showToast(`Added "${product.title.slice(0, 30)}" to cart`, 'success');
    }
    return;
  }

  const viewBtn = event.target.closest('.btn-view');
  if (viewBtn) {
    window.location.href = `product-details.html?id=${viewBtn.dataset.id}`;
  }
});

searchInput?.addEventListener('input', debounce(applyFilters, 250));
categorySelect?.addEventListener('change', applyFilters);
sortSelect?.addEventListener('change', applyFilters);

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener('DOMContentLoaded', initProductsPage);
