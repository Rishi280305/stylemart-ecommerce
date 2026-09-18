/* ============================================================
   API.JS — All communication with the Fake Store API lives here.
   Every other file asks THIS file for product data; nobody else
   calls fetch() directly. That keeps the API detail in one spot.
   ============================================================ */

const API_BASE = 'https://fakestoreapi.com';

/**
 * Small wrapper around fetch() that throws a readable error
 * instead of silently returning a bad response.
 */
async function apiRequest(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }
  return response.json();
}

/** Fetch every product. */
async function getAllProducts() {
  return apiRequest('/products');
}

/** Fetch a single product by its numeric id. */
async function getProductById(id) {
  return apiRequest(`/products/${id}`);
}

/** Fetch the list of category names, e.g. "electronics", "jewelery". */
async function getCategories() {
  return apiRequest('/products/categories');
}

/** Fetch every product in a single category. */
async function getProductsByCategory(category) {
  return apiRequest(`/products/category/${encodeURIComponent(category)}`);
}
