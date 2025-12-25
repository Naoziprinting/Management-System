// Main Application Logic

// Products Management
async function loadProductsPage() {
    const pageContent = document.getElementById('page-products');
    
    pageContent.innerHTML = `
        <div class="page-header">
            <h2>Manajemen Produk</h2>
            <p>Kelola data produk, stok, dan harga</p>
        </div>
        
        <div class="products-toolbar">
            <div class="search-box">
                <input type="text" id="product-search" placeholder="Cari produk...">
                <i class="fas fa-search"></i>
            </div>
            <button class="btn btn-primary" id="add-product-btn">
                <i class="fas fa-plus"></i> Tambah Produk
            </button>
            <button class="btn btn-secondary" id="import-products-btn">
                <i class="fas fa-upload"></i> Import
            </button>
            <button class="btn btn-success" id="export-products-btn">
                <i class="fas fa-download"></i> Export
            </button>
            <button class="btn btn-info" id="print-labels-btn">
                <i class="fas fa-print"></i> Print Label
            </button>
        </div>
        
        <div class="products-filters">
            <select id="category-filter">
                <option value="">Semua Kategori</option>
                <option value="Makanan">Makanan</option>
                <option value="Minuman">Minuman</option>
            </select>
            
            <select id="stock-filter">
                <option value="">Semua Stok</option>
                <option value="low">Stok Rendah</option>
                <option value="expiring">Mendekati Expired</option>
                <option value="out">Habis</option>
            </select>
        </div>
        
        <div class="products-table-container">
            <table class="products-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Nama Produk</th>
                        <th>Kategori</th>
                        <th>Stok</th>
                        <th>Harga Beli</th>
                        <th>Harga Jual</th>
                        <th>Expiry Date</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody id="products-list">
                    <tr>
                        <td colspan="8" class="loading-cell">
                            <div class="loading-spinner"></div>
                            Memuat data produk...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="pagination">
            <button class="btn-pagination" disabled>Sebelumnya</button>
            <span class="page-info">Halaman 1 dari 1</span>
            <button class="btn-pagination" disabled>Selanjutnya</button>
        </div>
    `;
    
    // Load products data
    await loadProductsData();
    
    // Setup event listeners for products page
    setupProductsPageEvents();
}

async function loadProductsData() {
    // This will be replaced with actual API call
    setTimeout(() => {
        const productsList = document.getElementById('products-list');
        if (productsList) {
            productsList.innerHTML = `
                <tr>
                    <td>MKN-NAS-251224-001</td>
                    <td>Nasi Goreng Spesial</td>
                    <td>Makanan</td>
                    <td><span class="stock-badge high">45</span></td>
                    <td>Rp 15.000</td>
                    <td>Rp 20.000</td>
                    <td>25/12/2024</td>
                    <td class="actions">
                        <button class="btn-action view"><i class="fas fa-eye"></i></button>
                        <button class="btn-action edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete"><i class="fas fa-trash"></i></button>
                        <button class="btn-action qr"><i class="fas fa-qrcode"></i></button>
                    </td>
                </tr>
                <tr>
                    <td>MNM-COP-150125-001</td>
                    <td>Coca Cola 330ml</td>
                    <td>Minuman</td>
                    <td><span class="stock-badge low">8</span></td>
                    <td>Rp 5.000</td>
                    <td>Rp 7.500</td>
                    <td>15/01/2025</td>
                    <td class="actions">
                        <button class="btn-action view"><i class="fas fa-eye"></i></button>
                        <button class="btn-action edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete"><i class="fas fa-trash"></i></button>
                        <button class="btn-action qr"><i class="fas fa-qrcode"></i></button>
                    </td>
                </tr>
            `;
        }
    }, 1000);
}

function setupProductsPageEvents() {
    // Add product button
    document.getElementById('add-product-btn')?.addEventListener('click', () => {
        showAddProductModal();
    });
    
    // Search functionality
    document.getElementById('product-search')?.addEventListener('input', function(e) {
        // Implement search
        console.log('Searching:', e.target.value);
    });
}

function showAddProductModal() {
    // Create modal for adding product
    const modalHTML = `
        <div class="modal active" id="add-product-modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Tambah Produk Baru</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="add-product-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="product-name">Nama Produk *</label>
                                <input type="text" id="product-name" required>
                            </div>
                            <div class="form-group">
                                <label for="product-category">Kategori *</label>
                                <select id="product-category" required>
                                    <option value="">Pilih Kategori</option>
                                    <option value="Makanan">Makanan</option>
                                    <option value="Minuman">Minuman</option>
                                    <option value="Elektronik">Elektronik</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="buy-price">Harga Beli (Rp) *</label>
                                <input type="number" id="buy-price" required min="0">
                            </div>
                            <div class="form-group">
                                <label for="sell-price">Harga Jual (Rp)</label>
                                <input type="number" id="sell-price" readonly>
                                <small>Otomatis berdasarkan margin</small>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="initial-stock">Stok Awal *</label>
                                <input type="number" id="initial-stock" required min="0">
                            </div>
                            <div class="form-group">
                                <label for="min-stock">Stok Minimum</label>
                                <input type="number" id="min-stock" min="0">
                                <small>Otomatis berdasarkan algoritma</small>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="expiry-date">Expiry Date</label>
                                <input type="date" id="expiry-date">
                            </div>
                            <div class="form-group">
                                <label for="supplier">Supplier</label>
                                <select id="supplier">
                                    <option value="">Pilih Supplier</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="warehouse-location">Lokasi Gudang</label>
                            <input type="text" id="warehouse-location">
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary cancel">Batal</button>
                            <button type="submit" class="btn btn-primary">Simpan Produk</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup modal events
    const modal = document.getElementById('add-product-modal');
    const form = document.getElementById('add-product-form');
    
    // Close modal
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('.cancel').onclick = () => modal.remove();
    
    // Calculate sell price when buy price changes
    document.getElementById('buy-price').addEventListener('input', function() {
        const buyPrice = parseFloat(this.value) || 0;
        const sellPrice = buyPrice * 1.3; // 30% margin
        document.getElementById('sell-price').value = Math.round(sellPrice);
    });
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const productData = {
            name: document.getElementById('product-name').value,
            category: document.getElementById('product-category').value,
            buy_price: document.getElementById('buy-price').value,
            sell_price: document.getElementById('sell-price').value,
            initial_stock: document.getElementById('initial-stock').value,
            min_stock: document.getElementById('min-stock').value,
            expiry_date: document.getElementById('expiry-date').value,
            supplier: document.getElementById('supplier').value,
            warehouse_location: document.getElementById('warehouse-location').value
        };
        
        // TODO: Send to API
        console.log('Product data:', productData);
        
        // Close modal and refresh products list
        modal.remove();
        loadProductsData();
    });
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                           type === 'error' ? 'exclamation-circle' : 
                           type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">${message}</div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').onclick = () => notification.remove();
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        border-left: 4px solid var(--info-color);
    }
    
    .notification-success {
        border-left-color: var(--success-color);
    }
    
    .notification-error {
        border-left-color: var(--danger-color);
    }
    
    .notification-warning {
        border-left-color: var(--warning-color);
    }
    
    .notification-icon {
        font-size: 1.5rem;
        color: var(--info-color);
    }
    
    .notification-success .notification-icon {
        color: var(--success-color);
    }
    
    .notification-error .notification-icon {
        color: var(--danger-color);
    }
    
    .notification-warning .notification-icon {
        color: var(--warning-color);
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.25rem;
    }
    
    .fade-out {
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;

document.head.appendChild(notificationStyles);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Show welcome notification if first visit today
    const lastVisit = localStorage.getItem('lastVisit');
    const today = new Date().toDateString();
    
    if (lastVisit !== today) {
        setTimeout(() => {
            showNotification('Selamat datang di Sistem Inventory Youzi Corp!', 'info');
        }, 1000);
        localStorage.setItem('lastVisit', today);
    }
});
