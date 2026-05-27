// Products page logic
let allProducts = [];
let allCategories = [];

function loadProducts() {
    allProducts = CRM.getProducts();
    allCategories = CRM.getCategories();
    renderCategoryFilter();
    renderProductsGrid();
}

function renderCategoryFilter() {
    const filter = document.getElementById('category-filter');
    filter.innerHTML = '<option value="all">Все категории</option>' + 
        allCategories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.title)}</option>`).join('');
}

function renderProductsGrid() {
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-products')?.value.toLowerCase() || '';
    
    let filtered = [...allProducts];
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category_id == categoryFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm));
    }
    
    const grid = document.getElementById('products-grid');
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Нет товаров. Добавьте первый!</div>';
        return;
    }
    
    grid.innerHTML = filtered.map(product => {
        const category = allCategories.find(c => c.id == product.category_id);
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-title">${escapeHtml(product.title)}</div>
                <div class="product-price">${product.price.toLocaleString()} ₽</div>
                <div style="font-size:12px; color:#999; margin-bottom:8px;">${category ? category.title : 'Без категории'}</div>
                <div style="margin-bottom:8px;">
                    <span class="status-badge ${product.available ? 'status-completed' : 'status-cancelled'}">
                        ${product.available ? '✓ В наличии' : '✗ Нет в наличии'}
                    </span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-outline btn-sm" onclick="openProductModal(${product.id})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterProducts() {
    renderProductsGrid();
}

// --- Товары ---
function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('product-modal-title');
    const modalBody = document.getElementById('product-modal-body');
    
    const isEdit = !!productId;
    const product = isEdit ? allProducts.find(p => p.id == productId) : null;
    
    modalTitle.textContent = isEdit ? `Редактировать: ${product.title}` : 'Новый товар';
    
    modalBody.innerHTML = `
        <form id="product-form">
            <div class="form-group">
                <label>Название *</label>
                <input type="text" id="prod_title" required value="${escapeHtml(product?.title || '')}" placeholder="Футболка хлопок">
            </div>
            <div class="form-group">
                <label>Цена *</label>
                <input type="number" id="prod_price" required value="${product?.price || ''}" placeholder="1990" step="1">
            </div>
            <div class="form-group">
                <label>Категория</label>
                <select id="prod_category">
                    <option value="">— Без категории —</option>
                    ${allCategories.map(cat => `
                        <option value="${cat.id}" ${product?.category_id == cat.id ? 'selected' : ''}>${escapeHtml(cat.title)}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="prod_available" ${product?.available !== false ? 'checked' : ''}>
                    В наличии
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeProductModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Сохранить' : 'Создать'}</button>
            </div>
        </form>
    `;
    
    modal.classList.add('active');
    
    document.getElementById('product-form').onsubmit = (e) => {
        e.preventDefault();
        saveProduct(productId);
    };
}

function saveProduct(productId) {
    const productData = {
        title: document.getElementById('prod_title').value,
        price: parseInt(document.getElementById('prod_price').value) || 0,
        category_id: document.getElementById('prod_category').value ? parseInt(document.getElementById('prod_category').value) : null,
        available: document.getElementById('prod_available').checked
    };
    
    if (productId) {
        CRM.updateProduct(productId, productData);
        showToast(`Товар "${productData.title}" обновлён`, 'success');
    } else {
        CRM.addProduct(productData);
        showToast(`Товар "${productData.title}" добавлен`, 'success');
    }
    
    closeProductModal();
    loadProducts();
}

function deleteProduct(id) {
    const product = allProducts.find(p => p.id == id);
    if (confirm(`Удалить товар "${product?.title}"? Это действие нельзя отменить.`)) {
        CRM.deleteProduct(id);
        loadProducts();
        showToast(`Товар удалён`, 'warning');
    }
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

// --- Категории ---
function openCategoryModal() {
    const modal = document.getElementById('category-modal');
    const modalBody = document.getElementById('category-modal-body');
    
    renderCategoriesList();
    modal.classList.add('active');
}

function renderCategoriesList() {
    const categories = CRM.getCategories();
    const modalBody = document.getElementById('category-modal-body');
    
    modalBody.innerHTML = `
        <form id="category-form" style="margin-bottom: 24px;">
            <div style="display: flex; gap: 8px;">
                <input type="text" id="new-category-name" placeholder="Название категории" style="flex:1; padding: 10px; border:1px solid #ddd; border-radius:8px;">
                <button type="submit" class="btn btn-primary">➕ Добавить</button>
            </div>
        </form>
        <div id="categories-list">
            ${categories.map(cat => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
                    <span>📁 ${escapeHtml(cat.title)}</span>
                    <div>
                        <button class="btn btn-outline btn-sm" onclick="editCategory(${cat.id}, '${escapeHtml(cat.title)}')">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteCategory(${cat.id})">🗑️</button>
                    </div>
                </div>
            `).join('')}
            ${categories.length === 0 ? '<div style="text-align:center; padding:20px; color:#999;">Нет категорий. Создайте первую!</div>' : ''}
        </div>
        <div style="margin-top: 20px;">
            <button class="btn btn-outline" onclick="closeCategoryModal()">Закрыть</button>
        </div>
    `;
    
    document.getElementById('category-form').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('new-category-name').value.trim();
        if (name) {
            CRM.addCategory({ title: name, slug: name.toLowerCase().replace(/ /g, '-') });
            document.getElementById('new-category-name').value = '';
            renderCategoriesList();
            loadProducts(); // обновляем фильтр и товары
            showToast(`Категория "${name}" добавлена`, 'success');
        }
    };
}

function editCategory(id, oldName) {
    const newName = prompt('Введите новое название категории:', oldName);
    if (newName && newName.trim()) {
        CRM.updateCategory(id, { title: newName.trim(), slug: newName.trim().toLowerCase().replace(/ /g, '-') });
        renderCategoriesList();
        loadProducts();
        showToast(`Категория переименована в "${newName}"`, 'success');
    }
}

function deleteCategory(id) {
    const categories = CRM.getCategories();
    const category = categories.find(c => c.id == id);
    if (confirm(`Удалить категорию "${category?.title}"? Товары в этой категории останутся без категории.`)) {
        CRM.deleteCategory(id);
        renderCategoriesList();
        loadProducts();
        showToast(`Категория "${category?.title}" удалена`, 'warning');
    }
}

function closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('active');
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#0066cc'}; 
        color: white; padding: 12px 20px; border-radius: 8px; z-index: 2000; animation: fadeInOut 2s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Анимация для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        15% { opacity: 1; transform: translateY(0); }
        85% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(20px); }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});
