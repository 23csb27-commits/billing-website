// Local Storage Management
const Storage = {
    // Keys for local storage
    KEYS: {
        PRODUCTS: 'rk_dress_shop_products',
        BILLS: 'rk_dress_shop_bills',
        CART: 'rk_dress_shop_cart',
        DRAFT_BILLS: 'rk_dress_shop_draft_bills'
    },

    // Initialize default products if storage is empty
    initDefaultProducts() {
        if (!this.getProducts() || this.getProducts().length === 0) {
            const defaultProducts = [
                {
                    id: '1',
                    name: 'T-shirt',
                    price: 499.00,
                    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'
                },
                {
                    id: '2',
                    name: 'Trackpant',
                    price: 799.00,
                    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&h=400&fit=crop'
                },
                {
                    id: '3',
                    name: 'Sport T-shirt',
                    price: 599.00,
                    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=400&fit=crop'
                }
            ];
            this.saveProducts(defaultProducts);
        }
    },

    // Products Management
    getProducts() {
        const products = localStorage.getItem(this.KEYS.PRODUCTS);
        return products ? JSON.parse(products) : [];
    },

    saveProducts(products) {
        localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
    },

    addProduct(product) {
        const products = this.getProducts();
        const newProduct = {
            ...product,
            id: Date.now().toString()
        };
        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    },

    updateProduct(id, updatedProduct) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct };
            this.saveProducts(products);
            return products[index];
        }
        return null;
    },

    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        this.saveProducts(filtered);
        return filtered;
    },

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    },

    // Bills Management
    getBills() {
        const bills = localStorage.getItem(this.KEYS.BILLS);
        return bills ? JSON.parse(bills) : [];
    },

    saveBills(bills) {
        localStorage.setItem(this.KEYS.BILLS, JSON.stringify(bills));
    },

    addBill(bill) {
        const bills = this.getBills();
        const newBill = {
            ...bill,
            id: `BILL-${Date.now()}`,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        bills.unshift(newBill); // Add to beginning
        this.saveBills(bills);
        return newBill;
    },

    getBillById(id) {
        const bills = this.getBills();
        return bills.find(b => b.id === id);
    },

    updateBill(id, updatedBill) {
        const bills = this.getBills();
        const index = bills.findIndex(b => b.id === id);
        if (index !== -1) {
            // Recalculate total and itemCount
            const total = updatedBill.items.reduce((sum, item) => sum + item.subtotal, 0);
            const itemCount = updatedBill.items.reduce((sum, item) => sum + item.quantity, 0);
            
            bills[index] = {
                ...bills[index],
                ...updatedBill,
                total: total,
                itemCount: itemCount
            };
            this.saveBills(bills);
            return bills[index];
        }
        return null;
    },

    deleteBill(id) {
        const bills = this.getBills();
        const filtered = bills.filter(b => b.id !== id);
        this.saveBills(filtered);
        return filtered;
    },

    // Cart Management
    getCart() {
        const cart = localStorage.getItem(this.KEYS.CART);
        return cart ? JSON.parse(cart) : [];
    },

    saveCart(cart) {
        localStorage.setItem(this.KEYS.CART, JSON.stringify(cart));
    },

    clearCart() {
        localStorage.removeItem(this.KEYS.CART);
    },

    // Draft Bills Management (for saving cart as draft)
    getDraftBills() {
        const drafts = localStorage.getItem(this.KEYS.DRAFT_BILLS);
        return drafts ? JSON.parse(drafts) : [];
    },

    saveDraftBills(drafts) {
        localStorage.setItem(this.KEYS.DRAFT_BILLS, JSON.stringify(drafts));
    },

    addDraftBill(draft) {
        const drafts = this.getDraftBills();
        const newDraft = {
            ...draft,
            id: `DRAFT-${Date.now()}`,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        drafts.unshift(newDraft);
        this.saveDraftBills(drafts);
        return newDraft;
    },

    updateDraftBill(id, updatedDraft) {
        const drafts = this.getDraftBills();
        const index = drafts.findIndex(d => d.id === id);
        if (index !== -1) {
            drafts[index] = { ...drafts[index], ...updatedDraft };
            this.saveDraftBills(drafts);
            return drafts[index];
        }
        return null;
    },

    deleteDraftBill(id) {
        const drafts = this.getDraftBills();
        const filtered = drafts.filter(d => d.id !== id);
        this.saveDraftBills(filtered);
        return filtered;
    },

    getDraftBillById(id) {
        const drafts = this.getDraftBills();
        return drafts.find(d => d.id === id);
    },

    loadDraftToCart(draftId) {
        const draft = this.getDraftBillById(draftId);
        if (draft && draft.items) {
            const cart = draft.items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                image: item.image || '',
                quantity: item.quantity
            }));
            this.saveCart(cart);
            return true;
        }
        return false;
    },

    // Initialize storage
    init() {
        this.initDefaultProducts();
    }
};

// Initialize storage on load
Storage.init();

