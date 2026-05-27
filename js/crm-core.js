// CRM Core v1.0 — работа с данными через localStorage
const CRM = {
    // Версия хранилища (при изменении структуры данных увеличивать)
    version: '1.0',
    
    // Инициализация: создаём дефолтные данные, если их нет
    init: function() {
        if (!localStorage.getItem('crm_data')) {
            const defaultData = {
                products: [
                    { id: 1, title: 'Хлопковая футболка', price: 1990, category_id: 1, available: true, image: 'tshirt.jpg', created_at: new Date().toISOString() },
                    { id: 2, title: 'Джинсы skinny', price: 3990, category_id: 1, available: true, image: 'jeans.jpg', created_at: new Date().toISOString() },
                    { id: 3, title: 'Кеды белые', price: 2990, category_id: 2, available: false, image: 'shoes.jpg', created_at: new Date().toISOString() }
                ],
                categories: [
                    { id: 1, title: 'Одежда', slug: 'clothing' },
                    { id: 2, title: 'Обувь', slug: 'shoes' }
                ],
                / Внутри init(), в defaultData.leads, обновите заявки:
leads: [
    { 
        id: 1, 
        client_name: 'Иван Петров', 
        phone: '+7 (999) 123-45-67', 
        email: 'ivan@example.com',
        address: 'г. Москва, ул. Тверская, д. 10, кв. 5',
        products: [{ id: 1, count: 2 }, { id: 2, count: 1 }],
        status: 'new',
        delivery_method: 'courier',
        payment_method: 'card',
        total: 1990*2 + 3990,
        comment: 'Позвонить перед доставкой',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    { 
        id: 2, 
        client_name: 'Мария Сидорова', 
        phone: '+7 (888) 555-12-34', 
        email: 'maria@example.com',
        address: 'г. Санкт-Петербург, Невский пр., д. 25',
        products: [{ id: 3, count: 1 }],
        status: 'processing',
        delivery_method: 'pickup',
        payment_method: 'cash',
        total: 2990,
        comment: '',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
    }
],
                settings: {
                    delivery_methods: ['Самовывоз', 'Курьером', 'Почта России'],
                    payment_methods: ['Наличные', 'Карта при получении', 'Оплата на сайте'],
                    site_url: 'https://hometimag-ux.github.io/murano-apparel/',
                    crm_name: 'Murano CRM'
                },
                next_ids: {
                    product: 4,
                    category: 3,
                    lead: 3
                }
            };
            localStorage.setItem('crm_data', JSON.stringify(defaultData));
        }
    },
    
    // Получить все данные
    getAll: function() {
        return JSON.parse(localStorage.getItem('crm_data'));
    },
    
    // Сохранить все данные
    saveAll: function(data) {
        localStorage.setItem('crm_data', JSON.stringify(data));
    },
    
    // --- Товары ---
    getProducts: function() {
        return this.getAll().products;
    },
    
    addProduct: function(product) {
        const data = this.getAll();
        const newId = data.next_ids.product;
        product.id = newId;
        product.created_at = new Date().toISOString();
        data.products.push(product);
        data.next_ids.product = newId + 1;
        this.saveAll(data);
        return product;
    },
    
    updateProduct: function(id, updates) {
        const data = this.getAll();
        const index = data.products.findIndex(p => p.id == id);
        if (index !== -1) {
            data.products[index] = { ...data.products[index], ...updates };
            this.saveAll(data);
            return data.products[index];
        }
        return null;
    },
    
    deleteProduct: function(id) {
        const data = this.getAll();
        data.products = data.products.filter(p => p.id != id);
        this.saveAll(data);
    },
    
    // --- Категории ---
    getCategories: function() {
        return this.getAll().categories;
    },
    
    addCategory: function(category) {
        const data = this.getAll();
        const newId = data.next_ids.category;
        category.id = newId;
        data.categories.push(category);
        data.next_ids.category = newId + 1;
        this.saveAll(data);
        return category;
    },
    
    updateCategory: function(id, updates) {
        const data = this.getAll();
        const index = data.categories.findIndex(c => c.id == id);
        if (index !== -1) {
            data.categories[index] = { ...data.categories[index], ...updates };
            this.saveAll(data);
            return data.categories[index];
        }
        return null;
    },
    
    deleteCategory: function(id) {
        const data = this.getAll();
        data.categories = data.categories.filter(c => c.id != id);
        this.saveAll(data);
    },
    
    // --- Заявки (лиды) ---
    getLeads: function() {
        return this.getAll().leads;
    },
    
    addLead: function(lead) {
        const data = this.getAll();
        const newId = data.next_ids.lead;
        lead.id = newId;
        lead.created_at = new Date().toISOString();
        lead.updated_at = new Date().toISOString();
        data.leads.unshift(lead); // новые в начало
        data.next_ids.lead = newId + 1;
        this.saveAll(data);
        return lead;
    },
    
    updateLead: function(id, updates) {
        const data = this.getAll();
        const index = data.leads.findIndex(l => l.id == id);
        if (index !== -1) {
            updates.updated_at = new Date().toISOString();
            data.leads[index] = { ...data.leads[index], ...updates };
            this.saveAll(data);
            return data.leads[index];
        }
        return null;
    },
    
    deleteLead: function(id) {
        const data = this.getAll();
        data.leads = data.leads.filter(l => l.id != id);
        this.saveAll(data);
    },
    
    // --- Настройки ---
    getSettings: function() {
        return this.getAll().settings;
    },
    
    updateSettings: function(updates) {
        const data = this.getAll();
        data.settings = { ...data.settings, ...updates };
        this.saveAll(data);
        return data.settings;
    },
    
    // --- Статистика для дашборда ---
    getStats: function() {
        const data = this.getAll();
        const leads = data.leads;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const todayLeads = leads.filter(l => new Date(l.created_at) >= today).length;
        const newLeads = leads.filter(l => l.status === 'new').length;
        const processingLeads = leads.filter(l => l.status === 'processing').length;
        const totalRevenue = leads.filter(l => l.status === 'completed').reduce((sum, l) => sum + (l.total || 0), 0);
        
        return {
            total_products: data.products.length,
            total_leads: leads.length,
            today_leads: todayLeads,
            new_leads: newLeads,
            processing_leads: processingLeads,
            total_revenue: totalRevenue
        };
    }
};

// Автоматическая инициализация
CRM.init();

// Экспорт для использования в других файлах
window.CRM = CRM;
