// Dashboard Module
const Dashboard = {
    currentPeriod: 'day',

    // Render dashboard
    renderDashboard(period = 'day') {
        this.currentPeriod = period;
        const stats = this.calculateStats(period);
        const container = document.getElementById('dashboard-stats');

        container.innerHTML = `
            <div class="stat-card">
                <h3>Total Sales</h3>
                <div class="stat-value">${stats.totalSales}</div>
                <div class="stat-label">Bills Generated</div>
            </div>
            <div class="stat-card">
                <h3>Total Revenue</h3>
                <div class="stat-value">₹${stats.totalRevenue.toFixed(2)}</div>
                <div class="stat-label">Total Income</div>
            </div>
            <div class="stat-card">
                <h3>Items Sold</h3>
                <div class="stat-value">${stats.itemsSold}</div>
                <div class="stat-label">Total Products</div>
            </div>
            <div class="stat-card">
                <h3>Average Bill</h3>
                <div class="stat-value">₹${stats.averageBill.toFixed(2)}</div>
                <div class="stat-label">Per Transaction</div>
            </div>
            <div class="stat-card">
                <h3>Top Product</h3>
                <div class="stat-value">${stats.topProduct.name || 'N/A'}</div>
                <div class="stat-label">${stats.topProduct.quantity || 0} sold</div>
            </div>
            <div class="stat-card">
                <h3>Best Day</h3>
                <div class="stat-value">₹${stats.bestDay.revenue.toFixed(2)}</div>
                <div class="stat-label">${stats.bestDay.date || 'N/A'}</div>
            </div>
        `;
    },

    // Calculate statistics for given period
    calculateStats(period) {
        const bills = Storage.getBills();
        const now = new Date();
        let filteredBills = [];

        // Filter bills by period
        switch (period) {
            case 'day':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                filteredBills = bills.filter(bill => {
                    const billDate = new Date(bill.timestamp);
                    return billDate >= today;
                });
                break;

            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                filteredBills = bills.filter(bill => {
                    const billDate = new Date(bill.timestamp);
                    return billDate >= monthStart;
                });
                break;

            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                filteredBills = bills.filter(bill => {
                    const billDate = new Date(bill.timestamp);
                    return billDate >= yearStart;
                });
                break;

            default:
                filteredBills = bills;
        }

        // Calculate statistics
        const totalSales = filteredBills.length;
        const totalRevenue = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
        const itemsSold = filteredBills.reduce((sum, bill) => sum + bill.itemCount, 0);
        const averageBill = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Calculate top product
        const productSales = {};
        filteredBills.forEach(bill => {
            bill.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = 0;
                }
                productSales[item.name] += item.quantity;
            });
        });

        const topProduct = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

        // Calculate best day
        const dailyRevenue = {};
        filteredBills.forEach(bill => {
            const date = new Date(bill.timestamp);
            const dateKey = date.toLocaleDateString();
            if (!dailyRevenue[dateKey]) {
                dailyRevenue[dateKey] = 0;
            }
            dailyRevenue[dateKey] += bill.total;
        });

        const bestDay = Object.entries(dailyRevenue)
            .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

        return {
            totalSales,
            totalRevenue,
            itemsSold,
            averageBill,
            topProduct: {
                name: topProduct[0],
                quantity: topProduct[1]
            },
            bestDay: {
                date: bestDay[0],
                revenue: bestDay[1]
            }
        };
    },

    // Initialize dashboard
    init() {
        // Period filter buttons
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                
                // Update active state
                document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Render dashboard
                this.renderDashboard(period);
            });
        });

        // Initial render
        this.renderDashboard('day');
    }
};

