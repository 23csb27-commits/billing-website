// Bills Module
const Bills = {
    currentEditingBillId: null,

    // Render all bills
    renderBills() {
        const container = document.getElementById('bills-container');
        const bills = Storage.getBills();

        if (bills.length === 0) {
            container.innerHTML = '<p class="empty-cart">No bills generated yet</p>';
            return;
        }

        container.innerHTML = bills.map(bill => {
            const date = new Date(bill.date);
            const formattedDate = date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="bill-card">
                    <div class="bill-header">
                        <div class="bill-id">${bill.id}</div>
                        <div class="bill-date">${formattedDate}</div>
                    </div>
                    <div class="bill-info">
                        <div>Items: ${bill.itemCount}</div>
                    </div>
                    <div class="bill-total">Total: ₹${bill.total.toFixed(2)}</div>
                    <div class="bill-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <button class="btn btn-edit" onclick="event.stopPropagation(); Bills.viewBill('${bill.id}')">View</button>
                        <button class="btn btn-primary" onclick="event.stopPropagation(); Bills.editBill('${bill.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); Bills.deleteBill('${bill.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // View bill details
    viewBill(billId) {
        const bill = Storage.getBillById(billId);
        if (!bill) {
            alert('Bill not found');
            return;
        }

        const date = new Date(bill.date);
        const formattedDate = date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const billDetails = document.getElementById('bill-details');
        billDetails.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <strong>Bill ID:</strong> ${bill.id}<br>
                <strong>Date:</strong> ${formattedDate}
            </div>
            <div style="margin-top: 1rem;">
                <h3 style="margin-bottom: 0.5rem;">Items:</h3>
                ${bill.items.map(item => `
                    <div class="bill-detail-item">
                        <div>
                            <strong>${item.name}</strong><br>
                            <small>₹${item.price.toFixed(2)} × ${item.quantity}</small>
                        </div>
                        <div>
                            <strong>₹${item.subtotal.toFixed(2)}</strong>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="bill-detail-total">
                <div style="display: flex; justify-content: space-between;">
                    <span>Total:</span>
                    <span>₹${bill.total.toFixed(2)}</span>
                </div>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="Bills.editBill('${bill.id}')">Edit Bill</button>
                <button class="btn btn-danger" onclick="Bills.deleteBill('${bill.id}')">Delete Bill</button>
            </div>
        `;

        // Show modal
        document.getElementById('bill-modal').classList.add('active');
    },

    // Edit bill
    editBill(billId) {
        const bill = Storage.getBillById(billId);
        if (!bill) {
            alert('Bill not found');
            return;
        }

        this.currentEditingBillId = billId;
        const products = Storage.getProducts();
        
        // Close view modal if open
        document.getElementById('bill-modal').classList.remove('active');

        // Populate edit form
        const billEditForm = document.getElementById('bill-edit-form');
        const billItemsContainer = document.getElementById('bill-edit-items');
        
        billItemsContainer.innerHTML = bill.items.map((item, index) => {
            const product = Storage.getProductById(item.productId);
            const productName = product ? product.name : item.name;
            const productPrice = product ? product.price : item.price;
            const isProductDeleted = !product;
            
            return `
                <div class="bill-edit-item" data-index="${index}">
                    <div class="form-group">
                        <label>Product:</label>
                        <select class="bill-item-product" data-index="${index}" required>
                            ${isProductDeleted ? `<option value="" selected>${item.name} (Deleted Product)</option>` : ''}
                            ${products.map(p => 
                                `<option value="${p.id}" ${p.id === item.productId ? 'selected' : ''}>${p.name} (₹${p.price.toFixed(2)})</option>`
                            ).join('')}
                        </select>
                        ${isProductDeleted ? '<small style="color: #dc3545;">This product has been deleted. Please select a new product.</small>' : ''}
                    </div>
                    <div class="form-group">
                        <label>Quantity:</label>
                        <input type="number" class="bill-item-quantity" data-index="${index}" value="${item.quantity}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Price (₹):</label>
                        <input type="number" class="bill-item-price" data-index="${index}" value="${item.price}" step="0.01" min="0" required>
                    </div>
                    <div class="bill-item-subtotal">
                        <strong>Subtotal: ₹<span class="item-subtotal-value">${item.subtotal.toFixed(2)}</span></strong>
                    </div>
                    <button type="button" class="btn btn-danger" onclick="Bills.removeBillItem(${index})">Remove</button>
                </div>
            `;
        }).join('');

        // Add event listeners for dynamic calculations
        billItemsContainer.querySelectorAll('.bill-item-product').forEach(select => {
            select.addEventListener('change', (e) => {
                const productId = e.target.value;
                if (productId) {
                    const product = Storage.getProductById(productId);
                    if (product) {
                        const itemEl = e.target.closest('.bill-edit-item');
                        const priceInput = itemEl.querySelector('.bill-item-price');
                        priceInput.value = product.price;
                    }
                }
                this.updateBillItemSubtotal();
            });
        });

        billItemsContainer.querySelectorAll('.bill-item-quantity, .bill-item-price').forEach(input => {
            input.addEventListener('input', () => this.updateBillItemSubtotal());
        });

        // Show edit modal
        document.getElementById('bill-edit-modal').classList.add('active');
        this.updateBillTotal();
    },

    // Update bill item subtotal
    updateBillItemSubtotal() {
        const items = document.querySelectorAll('.bill-edit-item');
        items.forEach((itemEl, index) => {
            const productSelect = itemEl.querySelector('.bill-item-product');
            const quantityInput = itemEl.querySelector('.bill-item-quantity');
            const priceInput = itemEl.querySelector('.bill-item-price');
            const subtotalSpan = itemEl.querySelector('.item-subtotal-value');

            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const subtotal = quantity * price;

            subtotalSpan.textContent = subtotal.toFixed(2);
        });
        this.updateBillTotal();
    },

    // Update bill total
    updateBillTotal() {
        const subtotals = Array.from(document.querySelectorAll('.item-subtotal-value')).map(span => 
            parseFloat(span.textContent) || 0
        );
        const total = subtotals.reduce((sum, val) => sum + val, 0);
        document.getElementById('bill-edit-total').textContent = total.toFixed(2);
    },

    // Remove item from bill edit
    removeBillItem(index) {
        const itemEl = document.querySelector(`.bill-edit-item[data-index="${index}"]`);
        if (itemEl) {
            itemEl.remove();
            // Reindex remaining items
            document.querySelectorAll('.bill-edit-item').forEach((el, idx) => {
                el.dataset.index = idx;
                el.querySelectorAll('[data-index]').forEach(input => {
                    input.dataset.index = idx;
                });
            });
            this.updateBillTotal();
        }
    },

    // Add item to bill edit
    addBillItem() {
        const products = Storage.getProducts();
        if (products.length === 0) {
            alert('No products available. Please add products first.');
            return;
        }

        const billItemsContainer = document.getElementById('bill-edit-items');
        const currentItems = billItemsContainer.querySelectorAll('.bill-edit-item');
        const newIndex = currentItems.length;

        const newItemHtml = `
            <div class="bill-edit-item" data-index="${newIndex}">
                <div class="form-group">
                    <label>Product:</label>
                    <select class="bill-item-product" data-index="${newIndex}" required>
                        <option value="">Select Product</option>
                        ${products.map(p => 
                            `<option value="${p.id}">${p.name} (₹${p.price.toFixed(2)})</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantity:</label>
                    <input type="number" class="bill-item-quantity" data-index="${newIndex}" value="1" min="1" required>
                </div>
                <div class="form-group">
                    <label>Price (₹):</label>
                    <input type="number" class="bill-item-price" data-index="${newIndex}" value="0" step="0.01" min="0" required>
                </div>
                <div class="bill-item-subtotal">
                    <strong>Subtotal: ₹<span class="item-subtotal-value">0.00</span></strong>
                </div>
                <button type="button" class="btn btn-danger" onclick="Bills.removeBillItem(${newIndex})">Remove</button>
            </div>
        `;

        billItemsContainer.insertAdjacentHTML('beforeend', newItemHtml);

        // Add event listeners
        const newItemEl = billItemsContainer.querySelector(`.bill-edit-item[data-index="${newIndex}"]`);
        
        const productSelect = newItemEl.querySelector('.bill-item-product');
        productSelect.addEventListener('change', (e) => {
            const productId = e.target.value;
            if (productId) {
                const product = Storage.getProductById(productId);
                if (product) {
                    const priceInput = newItemEl.querySelector('.bill-item-price');
                    priceInput.value = product.price;
                }
            }
            this.updateBillItemSubtotal();
        });

        newItemEl.querySelectorAll('.bill-item-quantity, .bill-item-price').forEach(input => {
            input.addEventListener('input', () => this.updateBillItemSubtotal());
        });
    },

    // Save edited bill
    saveBill() {
        if (!this.currentEditingBillId) return;

        const items = [];
        const itemElements = document.querySelectorAll('.bill-edit-item');

        for (let itemEl of itemElements) {
            const productSelect = itemEl.querySelector('.bill-item-product');
            const quantityInput = itemEl.querySelector('.bill-item-quantity');
            const priceInput = itemEl.querySelector('.bill-item-price');

            const productId = productSelect.value;
            const quantity = parseFloat(quantityInput.value);
            const price = parseFloat(priceInput.value);

            if (!productId || !quantity || quantity <= 0 || !price || price <= 0) {
                alert('Please fill in all fields with valid values for all items');
                return;
            }

            const product = Storage.getProductById(productId);
            if (!product) {
                alert(`Product not found for item. Please select a valid product.`);
                return;
            }

            items.push({
                productId: productId,
                name: product.name,
                price: price,
                quantity: quantity,
                subtotal: price * quantity
            });
        }

        if (items.length === 0) {
            alert('Bill must have at least one item');
            return;
        }

        const updatedBill = {
            items: items
        };

        Storage.updateBill(this.currentEditingBillId, updatedBill);
        
        // Refresh displays
        this.renderBills();
        if (typeof Dashboard !== 'undefined') {
            Dashboard.renderDashboard(Dashboard.currentPeriod);
        }

        // Close modal
        this.closeEditModal();
        alert('Bill updated successfully!');
    },

    // Delete bill
    deleteBill(billId) {
        if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
            return;
        }

        Storage.deleteBill(billId);
        
        // Close modals if open
        document.getElementById('bill-modal').classList.remove('active');
        document.getElementById('bill-edit-modal').classList.remove('active');

        // Refresh displays
        this.renderBills();
        if (typeof Dashboard !== 'undefined') {
            Dashboard.renderDashboard(Dashboard.currentPeriod);
        }

        alert('Bill deleted successfully!');
    },

    // Close edit modal
    closeEditModal() {
        document.getElementById('bill-edit-modal').classList.remove('active');
        this.currentEditingBillId = null;
    },

    // Initialize bills module
    init() {
        // Close bill view modal
        const billModal = document.getElementById('bill-modal');
        billModal.querySelector('.close-modal').addEventListener('click', () => {
            billModal.classList.remove('active');
        });

        billModal.addEventListener('click', (e) => {
            if (e.target.id === 'bill-modal') {
                billModal.classList.remove('active');
            }
        });

        // Close bill edit modal
        const billEditModal = document.getElementById('bill-edit-modal');
        billEditModal.querySelector('.close-modal').addEventListener('click', () => {
            this.closeEditModal();
        });

        billEditModal.addEventListener('click', (e) => {
            if (e.target.id === 'bill-edit-modal') {
                this.closeEditModal();
            }
        });

        // Bill edit form
        document.getElementById('bill-edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBill();
        });

        // Add item button
        document.getElementById('add-bill-item-btn').addEventListener('click', () => {
            this.addBillItem();
        });

        // Cancel edit button
        document.getElementById('cancel-bill-edit-btn').addEventListener('click', () => {
            this.closeEditModal();
        });
    }
};

