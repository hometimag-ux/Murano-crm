// Settings page logic

function loadSettings() {
    const settings = CRM.getSettings();
    
    // Способы доставки
    const deliveryDiv = document.getElementById('delivery-methods-list');
    deliveryDiv.innerHTML = (settings.delivery_methods || []).map((method, index) => `
        <div class="settings-item">
            <span>🚚 ${escapeHtml(method)}</span>
            <button class="btn btn-danger btn-sm" onclick="removeDeliveryMethod(${index})">🗑️</button>
        </div>
    `).join('') || '<div style="color:#999; padding:12px 0;">Нет способов доставки</div>';
    
    // Способы оплаты
    const paymentDiv = document.getElementById('payment-methods-list');
    paymentDiv.innerHTML = (settings.payment_methods || []).map((method, index) => `
        <div class="settings-item">
            <span>💳 ${escapeHtml(method)}</span>
            <button class="btn btn-danger btn-sm" onclick="removePaymentMethod(${index})">🗑️</button>
        </div>
    `).join('') || '<div style="color:#999; padding:12px 0;">Нет способов оплаты</div>';
    
    // Общие настройки
    document.getElementById('crm-name').value = settings.crm_name || 'Murano CRM';
    document.getElementById('site-url').value = settings.site_url || '';
}

// Доставка
function addDeliveryMethod() {
    const input = document.getElementById('new-delivery');
    const value = input.value.trim();
    if (!value) return;
    
    const settings = CRM.getSettings();
    const methods = settings.delivery_methods || [];
    methods.push(value);
    CRM.updateSettings({ delivery_methods: methods });
    input.value = '';
    loadSettings();
    showToast('Способ доставки добавлен', 'success');
}

function removeDeliveryMethod(index) {
    const settings = CRM.getSettings();
    const methods = settings.delivery_methods || [];
    const removed = methods.splice(index, 1);
    CRM.updateSettings({ delivery_methods: methods });
    loadSettings();
    showToast(`Удалено: ${removed[0]}`, 'warning');
}

// Оплата
function addPaymentMethod() {
    const input = document.getElementById('new-payment');
    const value = input.value.trim();
    if (!value) return;
    
    const settings = CRM.getSettings();
    const methods = settings.payment_methods || [];
    methods.push(value);
    CRM.updateSettings({ payment_methods: methods });
    input.value = '';
    loadSettings();
    showToast('Способ оплаты добавлен', 'success');
}

function removePaymentMethod(index) {
    const settings = CRM.getSettings();
    const methods = settings.payment_methods || [];
    const removed = methods.splice(index, 1);
    CRM.updateSettings({ payment_methods: methods });
    loadSettings();
    showToast(`Удалено: ${removed[0]}`, 'warning');
}

// Общие настройки
function saveGeneralSettings() {
    const crm_name = document.getElementById('crm-name').value;
    const site_url = document.getElementById('site-url').value;
    
    CRM.updateSettings({ crm_name, site_url });
    showToast('Настройки сохранены', 'success');
}

// Экспорт всех данных
function exportAllData() {
    const data = CRM.getAll();
    const dataToExport = {
        export_date: new Date().toISOString(),
        version: CRM.version,
        ...data
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `murano_crm_backup_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Данные экспортированы', 'success');
}

// Импорт данных
function importAllData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            // Сохраняем, исключая метаданные экспорта
            const { export_date, version, ...cleanData } = imported;
            localStorage.setItem('crm_data', JSON.stringify(cleanData));
            showToast('Данные импортированы. Обновите страницу.', 'success');
            setTimeout(() => location.reload(), 1500);
        } catch(err) {
            showToast('Ошибка: неверный формат файла', 'danger');
        }
    };
    reader.readAsText(file);
    input.value = ''; // очищаем input
}

// Очистка всех данных
function clearAllData() {
    if (confirm('ВНИМАНИЕ! Будут удалены ВСЕ данные: заявки, товары, настройки. Сделайте экспорт перед очисткой.')) {
        if (confirm('Последнее предупреждение: данные будут удалены безвозвратно. Продолжить?')) {
            localStorage.removeItem('crm_data');
            CRM.init(); // пересоздаём с дефолтными данными
            showToast('Все данные очищены. Страница обновится.', 'warning');
            setTimeout(() => location.reload(), 1500);
        }
    }
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    const bgColor = type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#f44336';
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; background: ${bgColor}; 
        color: white; padding: 12px 20px; border-radius: 8px; z-index: 2000; 
        animation: fadeInOut 2s ease; font-size: 14px;
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

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
});
