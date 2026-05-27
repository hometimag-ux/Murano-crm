function renderStats() {
    const stats = CRM.getStats();
    const statsGrid = document.getElementById('stats-grid');
    
    if (!statsGrid) return;
    
    statsGrid.innerHTML = `
        <div class="stat-card"><div class="stat-title">📦 Товаров</div><div class="stat-value">${stats.total_products}</div></div>
        <div class="stat-card"><div class="stat-title">📋 Всего заявок</div><div class="stat-value">${stats.total_leads}</div></div>
        <div class="stat-card"><div class="stat-title">🆕 Новые сегодня</div><div class="stat-value">${stats.today_leads}</div></div>
        <div class="stat-card"><div class="stat-title">⏳ В обработке</div><div class="stat-value small">${stats.processing_leads}</div></div>
        <div class="stat-card"><div class="stat-title">💰 Выручка</div><div class="stat-value">${(stats.total_revenue || 0).toLocaleString()} ₽</div></div>
    `;
}

function renderRecentLeads() {
    const leads = CRM.getLeads();
    const tbody = document.getElementById('recent-leads-body');
    
    if (!tbody) return;
    
    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Нет заявок</td></tr>';
        return;
    }
    
    tbody.innerHTML = leads.slice(0, 5).map(lead => `
        <tr>
            <td>${escapeHtml(lead.client_name)}</td>
            <td>${escapeHtml(lead.phone)}</td>
            <td>${(lead.total || 0).toLocaleString()} ₽</td>
            <td><span class="status-badge status-${lead.status}">${getStatusText(lead.status)}</span></td>
            <td>${new Date(lead.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const map = { new: 'Новая', processing: 'В обработке', completed: 'Завершена', cancelled: 'Отменена' };
    return map[status] || status;
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

document.addEventListener('DOMContentLoaded', () => {
    if (typeof CRM !== 'undefined') {
        renderStats();
        renderRecentLeads();
    } else {
        console.error('CRM не загружен');
    }
});
