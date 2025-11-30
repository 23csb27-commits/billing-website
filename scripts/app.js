// Main Application Controller
const App = {
    currentTab: 'products',

    // Initialize application
    init() {
        this.initNavigation();
        this.initTabs();
        Products.initForm();
        Billing.init();
        Dashboard.init();
        Bills.init();
        this.loadInitialData();
    },

    // Initialize navigation
    initNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
    },

    // Switch tabs
    switchTab(tabName) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            this.currentTab = tabName;
            this.loadTabContent(tabName);
        }
    },

    // Load content for specific tab
    loadTabContent(tabName) {
        switch (tabName) {
            case 'products':
                Products.renderProducts('products-grid');
                break;

            case 'billing':
                Products.renderProducts('billing-products-grid', Billing.addToCart);
                Billing.renderCart();
                Billing.renderDraftBills();
                break;

            case 'dashboard':
                Dashboard.renderDashboard(Dashboard.currentPeriod);
                break;

            case 'bills':
                Bills.renderBills();
                break;

            case 'manage':
                Products.renderManageProducts();
                break;
        }
    },

    // Initialize tab-specific features
    initTabs() {
        // Add product button in manage tab
        document.getElementById('add-product-btn').addEventListener('click', () => {
            Products.openAddModal();
        });
    },

    // Load initial data
    loadInitialData() {
        // Load products
        Products.renderProducts('products-grid');
        Products.renderProducts('billing-products-grid', Billing.addToCart);
        Products.renderManageProducts();

        // Load cart
        Billing.renderCart();

        // Load bills
        Bills.renderBills();

        // Load dashboard
        Dashboard.renderDashboard('day');
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

