// Billing Module
const Billing = {
    currentEditingCartItemId: null,

    // Add product to cart
    addToCart(product) {
        const cart = Storage.getCart();
        const existingItem = cart.find(item => item.productId === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        Storage.saveCart(cart);
        this.renderCart();
        
        // Show notification
        this.showNotification(`${product.name} added to cart!`);
    },

    // Render cart
    renderCart() {
        const container = document.getElementById('cart-items');
        const cart = Storage.getCart();

        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-cart">Cart is empty</p>';
            document.getElementById('cart-total').textContent = '0.00';
            return;
        }

        container.innerHTML = cart.map(item => {
            const itemId = item.id || item.productId;
            return `
                <div class="cart-item" data-item-id="${itemId}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">₹${item.price.toFixed(2)} each</div>
                        <div class="cart-item-subtotal">Subtotal: ₹${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="Billing.decreaseQuantity('${itemId}')">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="Billing.increaseQuantity('${itemId}')">+</button>
                    </div>
                    <div class="cart-item-actions">
                        <button class="btn btn-edit" onclick="Billing.editCartItem('${itemId}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.25rem;">Edit</button>
                        <button class="remove-item-btn" onclick="Billing.removeItem('${itemId}')">Remove</button>
                    </div>
                </div>
            `;
        }).join('');

        // Calculate and display total
        const total = this.calculateTotal();
        document.getElementById('cart-total').textContent = total.toFixed(2);
    },

    // Find cart item by ID (supports both id and productId)
    findCartItem(itemId) {
        const cart = Storage.getCart();
        return cart.find(item => (item.id === itemId) || (item.productId === itemId && !item.id));
    },

    // Increase quantity
    increaseQuantity(itemId) {
        const cart = Storage.getCart();
        const item = this.findCartItem(itemId);
        if (item) {
            // Ensure item has an ID
            if (!item.id) {
                item.id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            item.quantity += 1;
            Storage.saveCart(cart);
            this.renderCart();
        }
    },

    // Decrease quantity
    decreaseQuantity(itemId) {
        const cart = Storage.getCart();
        const item = this.findCartItem(itemId);
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                this.removeItem(itemId);
                return;
            }
            Storage.saveCart(cart);
            this.renderCart();
        }
    },

    // Remove item from cart
    removeItem(itemId) {
        const cart = Storage.getCart();
        const filtered = cart.filter(item => {
            const itemIdentifier = item.id || item.productId;
            return itemIdentifier !== itemId;
        });
        Storage.saveCart(filtered);
        this.renderCart();
        this.showNotification('Item removed from cart');
    },

    // Edit cart item
    editCartItem(itemId) {
        const item = this.findCartItem(itemId);
        if (!item) {
            alert('Item not found');
            return;
        }

        this.currentEditingCartItemId = itemId;
        const products = Storage.getProducts();

        // Populate edit form
        document.getElementById('cart-item-product').value = item.productId;
        document.getElementById('cart-item-quantity').value = item.quantity;
        document.getElementById('cart-item-price').value = item.price;

        // Show edit modal
        document.getElementById('cart-item-edit-modal').classList.add('active');
    },

    // Save edited cart item
    saveCartItem() {
        if (!this.currentEditingCartItemId) return;

        const cart = Storage.getCart();
        const item = this.findCartItem(this.currentEditingCartItemId);
        
        if (!item) {
            alert('Item not found');
            return;
        }

        const productId = document.getElementById('cart-item-product').value;
        const quantity = parseFloat(document.getElementById('cart-item-quantity').value);
        const price = parseFloat(document.getElementById('cart-item-price').value);

        if (!productId || !quantity || quantity <= 0 || !price || price <= 0) {
            alert('Please fill in all fields with valid values');
            return;
        }

        const product = Storage.getProductById(productId);
        if (!product) {
            alert('Product not found');
            return;
        }

        // Update item
        item.productId = productId;
        item.name = product.name;
        item.price = price;
        item.quantity = quantity;
        if (!item.id) {
            item.id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        Storage.saveCart(cart);
        this.renderCart();
        this.closeEditModal();
        this.showNotification('Cart item updated');
    },

    // Close edit modal
    closeEditModal() {
        document.getElementById('cart-item-edit-modal').classList.remove('active');
        this.currentEditingCartItemId = null;
        document.getElementById('cart-item-edit-form').reset();
    },

    // Calculate total
    calculateTotal() {
        const cart = Storage.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // Generate bill
    generateBill() {
        const cart = Storage.getCart();
        
        if (cart.length === 0) {
            alert('Cart is empty. Please add products to generate a bill.');
            return;
        }

        const total = this.calculateTotal();
        const bill = {
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            total: total,
            itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
        };

        // Save bill
        Storage.addBill(bill);
        
        // Clear cart
        Storage.clearCart();
        this.renderCart();

        // Show success message
        alert(`Bill generated successfully!\nBill ID: ${bill.id}\nTotal: ₹${total.toFixed(2)}`);
        
        // Refresh bills and dashboard if they exist
        if (typeof Bills !== 'undefined') {
            Bills.renderBills();
        }
        if (typeof Dashboard !== 'undefined') {
            Dashboard.renderDashboard('day');
        }
    },

    // Save cart as draft
    saveCartAsDraft() {
        const cart = Storage.getCart();
        
        if (cart.length === 0) {
            alert('Cart is empty. Please add products to save as draft.');
            return;
        }

        const draftName = prompt('Enter a name for this draft bill:', `Draft ${new Date().toLocaleDateString()}`);
        if (!draftName) return;

        const total = this.calculateTotal();
        const draft = {
            name: draftName,
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                image: item.image || '',
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            total: total,
            itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
        };

        Storage.addDraftBill(draft);
        this.showNotification('Cart saved as draft!');
        this.renderDraftBills();
    },

    // Load draft to cart
    loadDraftToCart(draftId) {
        if (confirm('Loading this draft will replace your current cart. Continue?')) {
            if (Storage.loadDraftToCart(draftId)) {
                this.renderCart();
                this.showNotification('Draft loaded to cart');
            } else {
                alert('Failed to load draft');
            }
        }
    },

    // Delete draft
    deleteDraft(draftId) {
        if (confirm('Are you sure you want to delete this draft?')) {
            Storage.deleteDraftBill(draftId);
            this.renderDraftBills();
            this.showNotification('Draft deleted');
        }
    },

    // Render draft bills
    renderDraftBills() {
        const container = document.getElementById('draft-bills-container');
        if (!container) return;

        const drafts = Storage.getDraftBills();

        if (drafts.length === 0) {
            container.innerHTML = '<p class="empty-cart">No draft bills saved</p>';
            return;
        }

        container.innerHTML = drafts.map(draft => {
            const date = new Date(draft.date);
            const formattedDate = date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="draft-bill-card">
                    <div class="draft-bill-header">
                        <div class="draft-bill-name">${draft.name}</div>
                        <div class="draft-bill-date">${formattedDate}</div>
                    </div>
                    <div class="draft-bill-info">
                        <div>Items: ${draft.itemCount}</div>
                        <div class="draft-bill-total">Total: ₹${draft.total.toFixed(2)}</div>
                    </div>
                    <div class="draft-bill-actions">
                        <button class="btn btn-primary" onclick="Billing.loadDraftToCart('${draft.id}')">Load to Cart</button>
                        <button class="btn btn-danger" onclick="Billing.deleteDraft('${draft.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Clear cart
    clearCart() {
        if (confirm('Are you sure you want to clear the cart?')) {
            Storage.clearCart();
            this.renderCart();
        }
    },

    // Show notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    },

    // Initialize billing
    init() {
        // Load cart on page load
        this.renderCart();

        // Generate bill button
        document.getElementById('generate-bill-btn').addEventListener('click', () => {
            this.generateBill();
        });

        // Clear cart button
        document.getElementById('clear-cart-btn').addEventListener('click', () => {
            this.clearCart();
        });

        // Save as draft button
        const saveDraftBtn = document.getElementById('save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                this.saveCartAsDraft();
            });
        }

        // Cart item edit form
        const cartEditForm = document.getElementById('cart-item-edit-form');
        if (cartEditForm) {
            cartEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCartItem();
            });
        }

        // Auto-fill price when product is selected
        const productSelect = document.getElementById('cart-item-product');
        if (productSelect) {
            productSelect.addEventListener('change', (e) => {
                const productId = e.target.value;
                if (productId) {
                    const product = Storage.getProductById(productId);
                    if (product) {
                        document.getElementById('cart-item-price').value = product.price;
                    }
                }
            });
        }

        // Close cart edit modal
        const cartEditModal = document.getElementById('cart-item-edit-modal');
        if (cartEditModal) {
            cartEditModal.querySelector('.close-modal').addEventListener('click', () => {
                this.closeEditModal();
            });

            cartEditModal.addEventListener('click', (e) => {
                if (e.target.id === 'cart-item-edit-modal') {
                    this.closeEditModal();
                }
            });

            const cancelBtn = document.getElementById('cancel-cart-edit-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.closeEditModal();
                });
            }
        }

        // Render draft bills
        this.renderDraftBills();
    }
};

