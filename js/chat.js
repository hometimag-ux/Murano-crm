// Chat logic
let currentClient = null;
let allClients = [];
let allMessages = [];

// Инициализация структуры сообщений в CRM, если её нет
function initMessages() {
    const data = CRM.getAll();
    if (!data.messages) {
        data.messages = {};
        CRM.saveAll(data);
    }
    allMessages = data.messages || {};
}

// Получение списка клиентов из заявок
function loadClients() {
    const leads = CRM.getLeads();
    const clientsMap = new Map();
    
    leads.forEach(lead => {
        const phone = lead.phone;
        if (!clientsMap.has(phone)) {
            clientsMap.set(phone, {
                id: lead.id,
                name: lead.client_name,
                phone: lead.phone,
                email: lead.email,
                lastMessage: null,
                lastMessageDate: null,
                unread: 0
            });
        }
    });
    
    // Добавляем информацию о последнем сообщении
    for (const [phone, client] of clientsMap) {
        const clientMessages = allMessages[phone] || [];
        if (clientMessages.length > 0) {
            const lastMsg = clientMessages[clientMessages.length - 1];
            client.lastMessage = lastMsg.text;
            client.lastMessageDate = lastMsg.created_at;
            // Подсчёт непрочитанных (от клиента, не прочитанных менеджером)
            client.unread = clientMessages.filter(m => !m.is_from_manager && !m.read).length;
        }
    }
    
    allClients = Array.from(clientsMap.values());
    renderClientsList();
}

function renderClientsList() {
    const searchTerm = document.getElementById('client-search')?.value.toLowerCase() || '';
    let filtered = [...allClients];
    
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(searchTerm) || 
            c.phone.includes(searchTerm)
        );
    }
    
    const container = document.getElementById('clients-list');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #999;">Нет клиентов</div>';
        return;
    }
    
    container.innerHTML = filtered.map(client => `
        <div class="client-item ${currentClient?.phone === client.phone ? 'active' : ''}" onclick="selectClient('${escapeHtml(client.phone)}')">
            <div class="client-avatar">${getInitials(client.name)}</div>
            <div class="client-info">
                <div class="client-name">${escapeHtml(client.name)}</div>
                <div class="client-last-message">${escapeHtml(client.lastMessage?.substring(0, 50) || 'Нет сообщений') || 'Нет сообщений'}</div>
            </div>
            ${client.unread > 0 ? `<div class="client-unread">${client.unread}</div>` : ''}
        </div>
    `).join('');
}

function selectClient(phone) {
    currentClient = allClients.find(c => c.phone === phone);
    if (!currentClient) return;
    
    // Сбрасываем непрочитанные
    const clientMessages = allMessages[phone] || [];
    clientMessages.forEach(msg => {
        if (!msg.is_from_manager) {
            msg.read = true;
        }
    });
    allMessages[phone] = clientMessages;
    saveMessages();
    
    // Обновляем список клиентов (чтобы убрать счётчик)
    loadClients();
    
    renderChatArea();
}

function renderChatArea() {
    const container = document.getElementById('chat-content');
    if (!currentClient) {
        container.innerHTML = '<div class="empty-chat">💬 Выберите клиента, чтобы начать диалог</div>';
        return;
    }
    
    const clientMessages = allMessages[currentClient.phone] || [];
    
    container.innerHTML = `
        <div class="chat-header">
            <div class="client-name">${escapeHtml(currentClient.name)}</div>
            <div class="client-phone">${escapeHtml(currentClient.phone)}</div>
        </div>
        <div class="messages-container" id="messages-container">
            ${clientMessages.length === 0 ? '<div class="empty-chat" style="padding:20px;">Нет сообщений. Напишите клиенту первым!</div>' : ''}
            ${clientMessages.map(msg => `
                <div class="message ${msg.is_from_manager ? 'outgoing' : 'incoming'}">
                    <div class="message-bubble">${escapeHtml(msg.text)}</div>
                    <div class="message-time">${formatDate(msg.created_at)}</div>
                </div>
            `).join('')}
        </div>
        <div class="chat-input-area">
            <input type="text" id="message-input" placeholder="Введите сообщение..." onkeypress="handleKeyPress(event)">
            <button class="btn btn-primary" onclick="sendMessage()">📤 Отправить</button>
        </div>
    `;
    
    // Скролл вниз
    setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }, 100);
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !currentClient) return;
    
    const message = {
        id: Date.now(),
        text: text,
        is_from_manager: true,
        created_at: new Date().toISOString(),
        read: true
    };
    
    if (!allMessages[currentClient.phone]) {
        allMessages[currentClient.phone] = [];
    }
    allMessages[currentClient.phone].push(message);
    saveMessages();
    
    input.value = '';
    renderChatArea();
    
    // Обновляем список клиентов (последнее сообщение)
    loadClients();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Функция для имитации входящего сообщения (для теста)
function receiveMessage(phone, text) {
    const message = {
        id: Date.now(),
        text: text,
        is_from_manager: false,
        created_at: new Date().toISOString(),
        read: false
    };
    
    if (!allMessages[phone]) {
        allMessages[phone] = [];
    }
    allMessages[phone].push(message);
    saveMessages();
    
    if (currentClient?.phone === phone) {
        renderChatArea();
    }
    loadClients();
    
    showToast(`📩 Новое сообщение от ${phone}`, 'info');
}

function saveMessages() {
    const data = CRM.getAll();
    data.messages = allMessages;
    CRM.saveAll(data);
}

function filterClients() {
    renderClientsList();
}

function getInitials(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    const bgColor = type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#0066cc';
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

// Добавляем стиль для анимации уведомлений
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

// Для теста: демо-сообщение через 5 секунд после загрузки (можно убрать)
setTimeout(() => {
    if (allClients.length > 0 && allClients[0]) {
        // receiveMessage(allClients[0].phone, 'Здравствуйте! Когда приедет заказ?');
    }
}, 5000);

document.addEventListener('DOMContentLoaded', () => {
    initMessages();
    loadClients();
});
