// Product Management Module
const Products = {
    // Render products grid
    renderProducts(containerId, onClickCallback = null) {
        const container = document.getElementById(containerId);
        const products = Storage.getProducts();

        if (products.length === 0) {
            container.innerHTML = '<p class="empty-cart">No products available</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <h3>${product.name}</h3>
                <div class="price">₹${product.price.toFixed(2)}</div>
                ${onClickCallback ? '<div class="price-label">Click to add to bill</div>' : ''}
            </div>
        `).join('');

        // Add click event listeners
        if (onClickCallback) {
            container.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const productId = card.dataset.productId;
                    const product = Storage.getProductById(productId);
                    if (product) {
                        onClickCallback(product);
                    }
                });
            });
        }
    },

    // Render products for management
    renderManageProducts() {
        const container = document.getElementById('products-management');
        const products = Storage.getProducts();

        if (products.length === 0) {
            container.innerHTML = '<p class="empty-cart">No products available. Add your first product!</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="manage-product-card" data-product-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="manage-product-image">
                <div class="manage-product-info">
                    <div class="manage-product-name">${product.name}</div>
                    <div class="manage-product-price">₹${product.price.toFixed(2)}</div>
                </div>
                <div class="manage-product-actions">
                    <button class="btn btn-edit" onclick="Products.editProduct('${product.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="Products.deleteProduct('${product.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    },

    // Open modal for adding product
    openAddModal() {
        document.getElementById('modal-title').textContent = 'Add Product';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-modal').classList.add('active');
    },

    // Open modal for editing product
    editProduct(id) {
        const product = Storage.getProductById(id);
        if (!product) return;

        document.getElementById('modal-title').textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-modal').classList.add('active');
    },

    // Delete product
    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            Storage.deleteProduct(id);
            this.renderManageProducts();
            this.renderProducts('products-grid');
            this.renderProducts('billing-products-grid', Billing.addToCart);
            // Clear cart if deleted product was in cart
            const cart = Storage.getCart();
            const updatedCart = cart.filter(item => item.productId !== id);
            Storage.saveCart(updatedCart);
            if (typeof Billing !== 'undefined') {
                Billing.renderCart();
            }
        }
    },

    // Save product (add or update)
    saveProduct(productData) {
        const id = document.getElementById('product-id').value;
        
        if (id) {
            // Update existing product
            Storage.updateProduct(id, productData);
        } else {
            // Add new product
            Storage.addProduct(productData);
        }

        // Refresh all product displays
        this.renderManageProducts();
        this.renderProducts('products-grid');
        this.renderProducts('billing-products-grid', Billing.addToCart);
        
        // Close modal
        this.closeModal();
    },

    // Close modal
    closeModal() {
        document.getElementById('product-modal').classList.remove('active');
    },

    // Initialize product form
    initForm() {
        const form = document.getElementById('product-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('product-name').value.trim();
            const price = parseFloat(document.getElementById('product-price').value);
            const image = document.getElementById('product-image').value.trim();

            if (!name || !price || !image) {
                alert('Please fill in all fields');
                return;
            }

            this.saveProduct({ name, price, image });
        });

        // Close modal handlers
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-product-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        document.getElementById('product-modal').addEventListener('click', (e) => {
            if (e.target.id === 'product-modal') {
                this.closeModal();
            }
        });
    }
};

