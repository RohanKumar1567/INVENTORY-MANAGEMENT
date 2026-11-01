const API_URL = '/api/products';
const form = document.getElementById('productForm');
const alertBox = document.getElementById('alert');
const tableBody = document.getElementById('productsTable');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEdit');
let products = [];
let editingId = null;
let alertTimer;

function showAlert(message, type = 'success') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.hidden = false;
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => { alertBox.hidden = true; }, 4500);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || 'The request could not be completed.');
  return data;
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value));
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

async function loadDashboard() {
  const stats = await apiRequest(`${API_URL}/dashboard`);
  document.getElementById('totalProducts').textContent = Number(stats.totalProducts).toLocaleString('en-IN');
  document.getElementById('totalStock').textContent = Number(stats.totalStock).toLocaleString('en-IN');
  document.getElementById('lowStockCount').textContent = Number(stats.lowStockProducts).toLocaleString('en-IN');
}

async function loadProducts() {
  products = await apiRequest(API_URL);
  document.getElementById('tableSummary').textContent = `${products.length} ${products.length === 1 ? 'product' : 'products'}`;
  document.getElementById('lowStockNotice').hidden = !products.some((product) => Number(product.quantity) <= 5);
  if (!products.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No products yet. Add your first product using the form above.</td></tr>';
    return;
  }
  tableBody.innerHTML = products.map((product) => {
    const low = Number(product.quantity) <= 5;
    return `<tr>
      <td class="product-name">${safeText(product.name)}</td><td>${safeText(product.category)}</td>
      <td>${formatPrice(product.price)}</td>
      <td><span class="quantity-badge ${low ? 'low' : ''}">${Number(product.quantity)}</span>${low ? '<span class="low-label">Low stock</span>' : ''}</td>
      <td>${formatDate(product.created_at)}</td>
      <td><div class="row-actions"><button class="action-button" type="button" data-action="edit" data-id="${Number(product.id)}">Edit</button><button class="action-button delete" type="button" data-action="delete" data-id="${Number(product.id)}">Delete</button></div></td>
    </tr>`;
  }).join('');
}

async function refreshPage() {
  try {
    await Promise.all([loadDashboard(), loadProducts()]);
  } catch (error) {
    showAlert(`${error.message} Start the backend and verify your MySQL configuration.`, 'error');
    document.getElementById('tableSummary').textContent = 'Inventory unavailable';
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Could not load inventory. Check the backend and database connection.</td></tr>';
  }
}

function resetForm() {
  form.reset();
  editingId = null;
  document.getElementById('formTitle').textContent = 'Add a product';
  submitButton.textContent = 'Add product';
  cancelEditButton.hidden = true;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const product = {
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    price: Number(document.getElementById('price').value),
    quantity: Number(document.getElementById('quantity').value),
  };
  submitButton.disabled = true;
  try {
    await apiRequest(editingId ? `${API_URL}/${editingId}` : API_URL, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(product) });
    showAlert(editingId ? 'Product updated successfully.' : 'Product added successfully.');
    resetForm();
    await refreshPage();
  } catch (error) { showAlert(error.message, 'error'); }
  finally { submitButton.disabled = false; }
});

cancelEditButton.addEventListener('click', resetForm);

tableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const product = products.find((item) => Number(item.id) === Number(button.dataset.id));
  if (!product) return;
  if (button.dataset.action === 'edit') {
    editingId = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('category').value = product.category;
    document.getElementById('price').value = product.price;
    document.getElementById('quantity').value = product.quantity;
    document.getElementById('formTitle').textContent = 'Edit product';
    submitButton.textContent = 'Save changes';
    cancelEditButton.hidden = false;
    form.scrollIntoView({ block: 'start' });
    document.getElementById('name').focus({ preventScroll: true });
    return;
  }
  if (!window.confirm(`Delete “${product.name}”? This action cannot be undone.`)) return;
  button.disabled = true;
  try {
    await apiRequest(`${API_URL}/${product.id}`, { method: 'DELETE' });
    if (Number(editingId) === Number(product.id)) resetForm();
    showAlert('Product deleted successfully.');
    await refreshPage();
  } catch (error) { showAlert(error.message, 'error'); }
});

refreshPage();
