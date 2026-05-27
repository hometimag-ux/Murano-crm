// Orders page logic with new columns
let currentLeads = [];
let currentFilter = 'all';
let currentSearch = '';
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;

function loadLeads() {
    currentLeads = CRM.getLeads();
    applyFiltersAndRender();
}

function applyFiltersAndRender() {
    let filtered = [...currentLeads];
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(lead => lead.status === currentFilter);
    }
    
    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        filtered = filtered.filter(lead => 
            lead.client_name.toLowerCase().includes(search) || 
            lead.phone.includes(search) ||
            (lead.email && lead.email.toLowerCase().includes(search))
        );
    }
    
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedLeads = filtered.slice(start, end);
    
    renderLeadsTable(paginatedLeads, filtered.length, start, end);
    renderPagination(filtered.length);
}

function renderLeadsTable(leads, totalCount, start, end) {
    const tbody = document.getElementById('leads-table-body');
    const products = CRM.getProducts();
    
    document.getElementById('pagination-start').textContent = totalCount === 0 ? 0 : start + 1;
    document.getElementById('pagination-end').textContent = Math.min(end, totalCount);
    document.getElementById('pagination-total').textContent = totalCount;
    
    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12">Нет заявок</td></tr>';
        return;
    }
    
    tbody.innerHTML = leads.map(lead => {
        // Формируем список товаров с количеством
        const productsHtml = (lead.products || []).map(p => {
            const product = products.find(pr => pr.id == p.id);
            return product ? `<div>${product.title} x${p.count}</div>` : `<div>Товар #${p.id} x${p.count}</div>`;
        }).join('');
        
        return `
            <tr>
                <td>${lead.id}</td>
                <td><strong>${escapeHtml(lead.client_name)}</strong></td>
                <td>${escapeHtml(lead.phone)}</td>
                <td>${escapeHtml(lead.email || '—')}</td>
                <td style="max-width: 200px;">${productsHtml || '—'}</td>
                <td>${getDeliveryText(lead.delivery_method)}</td>
                <td style="max-width: 200px;">${escapeHtml(lead.address || '—')}</td>
                <td><strong>${(lead.total || 0).toLocaleString()} ₽</strong></td>
                <td>
                    <select class="status-badge status-${lead.status}" onchange="updateLeadStatus(${lead.id}, this.value)" style="border: none; cursor: pointer;">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>🆕 Новая</option>
                        <option value="processing" ${lead.status === 'processing' ? 'selected' : ''}>⏳ В обработке</option>
                        <option value="completed" ${lead.status === 'completed' ? 'selected' : ''}>✅ Завершена</option>
                        <option value="cancelled" ${lead.status === 'cancelled' ? 'selected' : ''}>❌ Отменена</option>
                    </select>
                </td>
                <td>${getPaymentText(lead.payment_method)}</td>
                <td><small>${formatDateTime(lead.created_at)}</small></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="editLead(${lead.id})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteLead(${lead.id})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
}

function renderPagination(totalCount) {
    const pageNumbersDiv = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (totalCount === 0) {
        pageNumbersDiv.innerHTML = '';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }
    
    prevBtn.disabled = (currentPage === 1);
    nextBtn.disabled = (currentPage === totalPages);
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (endPage - startPage < 4) {
        if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
        if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
    }
    
    let pagesHtml = '';
    if (startPage > 1) {
        pagesHtml += `<button class="btn btn-outline btn-sm" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) pagesHtml += `<span style="padding: 0 4px;">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pagesHtml += `<button class="btn ${i === currentPage ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="goToPage(${i})" style="min-width: 36px;">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pagesHtml += `<span style="padding: 0 4px;">...</span>`;
        pagesHtml += `<button class="btn btn-outline btn-sm" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    pageNumbersDiv.innerHTML = pagesHtml;
}

function goToPage(page) { currentPage = page; applyFiltersAndRender(); }
function changePage(delta) { const newPage = currentPage + delta; if (newPage >= 1 && newPage <= totalPages) { currentPage = newPage; applyFiltersAndRender(); } }
function changePerPage() { itemsPerPage = parseInt(document.getElementById('per-page-select').value); currentPage = 1; applyFiltersAndRender(); }

function getDeliveryText(method) {
    const map = { courier: 'Курьер', pickup: 'Самовывоз', post: 'Почта' };
    return map[method] || method || '—';
}

function getPaymentText(method) {
    const map = { cash: 'Наличные', card: 'Карта', online: 'Онлайн' };
    return map[method] || method || '—';
}

function updateLeadStatus(id, newStatus) {
    CRM.updateLead(id, { status: newStatus });
    loadLeads();
    showToast(`Статус заявки #${id} обновлён`, 'success');
}

function deleteLead(id) {
    if (confirm('Удалить заявку? Это действие нельзя отменить.')) {
        CRM.deleteLead(id);
        loadLeads();
        showToast(`Заявка #${id} удалена`, 'warning');
    }
}

function openLeadModal(lead = null) {
    const modal = document.getElementById('lead-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const products = CRM.getProducts();
    const settings = CRM.getSettings();
    
    const isEdit = !!lead;
    modalTitle.textContent = isEdit ? `Редактирование заявки #${lead.id}` : 'Новая заявка';
    
    modalBody.innerHTML = `
        <form id="lead-form">
            <div class="form-group">
                <label>ФИО *</label>
                <input type="text" id="client_name" required value="${escapeHtml(lead?.client_name || '')}" placeholder="Иван Петров">
            </div>
            <div class="form-row" style="display: flex; gap: 12px;">
                <div class="form-group" style="flex:1;">
                    <label>Телефон *</label>
                    <input type="tel" id="phone" required value="${escapeHtml(lead?.phone || '')}" placeholder="+7 (999) 123-45-67">
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Email</label>
                    <input type="email" id="email" value="${escapeHtml(lead?.email || '')}" placeholder="client@example.com">
                </div>
            </div>
            <div class="form-group">
                <label>Адрес доставки</label>
                <input type="text" id="address" value="${escapeHtml(lead?.address || '')}" placeholder="г. Москва, ул. Примерная, д. 1">
            </div>
            <div class="form-group">
                <label>Товары</label>
                <div id="products-list" style="border: 1px solid #eee; border-radius: 8px; padding: 12px; max-height: 200px; overflow-y: auto;">
                    ${products.map(p => `
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <span style="flex:2;">${p.title} — ${p.price} ₽</span>
                            <input type="number" id="product_${p.id}" value="${getProductCount(lead, p.id)}" min="0" max="99" style="width: 70px;" placeholder="кол-во">
                        </div>
                    `).join('')}
                </div>
                <small style="color:#999;">Укажите количество для каждого товара</small>
            </div>
            <div class="form-row" style="display: flex; gap: 12px;">
                <div class="form-group" style="flex:1;">
                    <label>Способ доставки</label>
                    <select id="delivery_method">
                        ${(settings.delivery_methods || ['Курьером', 'Самовывоз', 'Почта']).map(m => {
                            const val = m.toLowerCase().replace(/ /g, '_');
                            return `<option value="${val}" ${lead?.delivery_method === val ? 'selected' : ''}>${m}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Способ оплаты</label>
                    <select id="payment_method">
                        ${(settings.payment_methods || ['Наличные', 'Карта при получении', 'Оплата на сайте']).map(m => {
                            const val = m.toLowerCase().replace(/ /g, '_');
                            return `<option value="${val}" ${lead?.payment_method === val ? 'selected' : ''}>${m}</option>`;
                        }).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Комментарий</label>
                <textarea id="comment" rows="3" placeholder="Пожелания, примечания...">${escapeHtml(lead?.comment || '')}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Сохранить' : 'Создать заявку'}</button>
            </div>
        </form>
    `;
    
    modal.classList.add('active');
    document.getElementById('lead-form').onsubmit = (e) => { e.preventDefault(); saveLead(lead); };
}

function getProductCount(lead, productId) {
    if (!lead || !lead.products) return 0;
    const found = lead.products.find(p => p.id == productId);
    return found ? found.count : 0;
}

function saveLead(existingLead) {
    const products = CRM.getProducts();
    const selectedProducts = [];
    let total = 0;
    
    products.forEach(p => {
        const count = parseInt(document.getElementById(`product_${p.id}`)?.value) || 0;
        if (count > 0) {
            selectedProducts.push({ id: p.id, count: count });
            total += p.price * count;
        }
    });
    
    const leadData = {
        client_name: document.getElementById('client_name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        products: selectedProducts,
        delivery_method: document.getElementById('delivery_method').value,
        payment_method: document.getElementById('payment_method').value,
        comment: document.getElementById('comment').value,
        total: total,
        status: existingLead?.status || 'new'
    };
    
    if (existingLead) {
        CRM.updateLead(existingLead.id, leadData);
        showToast(`Заявка #${existingLead.id} обновлена`, 'success');
    } else {
        CRM.addLead(leadData);
        showToast('Новая заявка создана', 'success');
    }
    
    closeModal();
    loadLeads();
}

function editLead(id) {
    const lead = currentLeads.find(l => l.id == id);
    if (lead) openLeadModal(lead);
}

function closeModal() { document.getElementById('lead-modal').classList.remove('active'); }
function filterLeads() { currentFilter = document.getElementById('status-filter').value; currentSearch = document.getElementById('search-input').value; currentPage = 1; applyFiltersAndRender(); }
function resetFilters() { document.getElementById('status-filter').value = 'all'; document.getElementById('search-input').value = ''; currentFilter = 'all'; currentSearch = ''; currentPage = 1; applyFiltersAndRender(); }

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#0066cc'}; color: white; padding: 12px 20px; border-radius: 8px; z-index: 2000; animation: fadeInOut 2s ease;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; });
}

const style = document.createElement('style');
style.textContent = `@keyframes fadeInOut { 0% { opacity: 0; transform: translateY(20px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(20px); } }`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => { loadLeads(); });
