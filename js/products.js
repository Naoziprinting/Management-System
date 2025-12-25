// File: js/products.js
// ================================================
// YOUZI CORP - PRODUCT MANAGEMENT FRONTEND
// ================================================

let currentProducts = [];
let currentPage = 1;
const productsPerPage = 10;

// ================================================
// PRODUCT PAGE LOADER
// ================================================

async function loadProductsPage() {
    console.log('📦 Loading products page...');
    
    const pageContent = document.getElementById('page-products');
    if (!pageContent) return;
    
    pageContent.innerHTML = `
        <div class="page-header">
            <h2>Manajemen Produk</h2>
            <p>Kelola data produk, stok, dan harga</p>
        </div>
        
        <div class="products-toolbar">
            <div class="search-box">
                <input type="text" id="product-search" placeholder="Cari produk (nama/SKU)...">
                <i class="fas fa-search"></i>
            </div>
            <div class="toolbar-actions">
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
        </div>
        
        <div class="products-filters">
            <div class="filter-group">
                <select id="category-filter" class="filter-select">
                    <option value="">Semua Kategori</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Pakaian">Pakaian</option>
                </select>
                
                <select id="stock-filter" class="filter-select">
                    <option value="">Semua Stok</option>
                    <option value="low">Stok Rendah</option>
                    <option value="expiring">Mendekati Expired</option>
                    <option value="out">Habis</option>
                </select>
                
                <select id="sort-filter" class="filter-select">
                    <option value="name_asc">Nama (A-Z)</option>
                    <option value="name_desc">Nama (Z-A)</option>
                    <option value="stock_asc">Stok (Rendah-Tinggi)</option>
                    <option value="stock_desc">Stok (Tinggi-Rendah)</option>
                    <option value="expiry_asc">Expiry (Terdekat)</option>
                </select>
            </div>
            
            <div class="filter-stats">
                <span id="product-count">Memuat...</span>
                <div class="stock-indicators">
                    <span class="stock-indicator low" title="Stok Rendah">0</span>
                    <span class="stock-indicator expiring" title="Mendekati Expired">0</span>
                </div>
            </div>
        </div>
        
        <div class="products-table-container">
            <table class="products-table">
                <thead>
                    <tr>
                        <th width="120">SKU</th>
                        <th>Nama Produk</th>
                        <th width="100">Kategori</th>
                        <th width="80">Stok</th>
                        <th width="100">Harga Beli</th>
                        <th width="100">Harga Jual</th>
                        <th width="100">Expiry Date</th>
                        <th width="150">Status</th>
                        <th width="120">Aksi</th>
                    </tr>
                </thead>
                <tbody id="products-list">
                    <tr>
                        <td colspan="9" class="loading-cell">
                            <div class="loading-spinner"></div>
                            <span>Memuat data produk...</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="products-footer">
            <div class="pagination">
                <button class="btn-pagination" id="prev-page" disabled>
                    <i class="fas fa-chevron-left"></i> Sebelumnya
                </button>
                <span class="page-info" id="page-info">Halaman 1 dari 1</span>
                <button class="btn-pagination" id="next-page" disabled>
                    Selanjutnya <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="page-size">
                <select id="page-size-select">
                    <option value="10">10 per halaman</option>
                    <option value="25">25 per halaman</option>
                    <option value="50">50 per halaman</option>
                    <option value="100">100 per halaman</option>
                </select>
            </div>
        </div>
    `;
    
    // Load products data
    await loadProductsData();
    
    // Setup event listeners
    setupProductsPageEvents();
}

// ================================================
// PRODUCT DATA MANAGEMENT
// ================================================

async function loadProductsData() {
    console.log('📥 Loading products data...');
    
    const loadingRow = document.querySelector('#products-list .loading-cell');
    if (loadingRow) {
        loadingRow.innerHTML = `
            <td colspan="9">
                <div class="loading-spinner"></div>
                <span>Memuat data produk...</span>
            </td>
        `;
    }
    
    try {
        const token = localStorage.getItem('youzi_token');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }
        
        // Get search and filter values
        const searchTerm = document.getElementById('product-search')?.value || '';
        const category = document.getElementById('category-filter')?.value || '';
        const stockFilter = document.getElementById('stock-filter')?.value || '';
        const sortFilter = document.getElementById('sort-filter')?.value || 'name_asc';
        
        // Build filters object
        const filters = {};
        if (category) filters.category = category;
        if (stockFilter === 'low') filters.lowStock = true;
        if (stockFilter === 'expiring') filters.expiringSoon = true;
        
        // Parse sort filter
        if (sortFilter.includes('_')) {
            const [sortBy, sortOrder] = sortFilter.split('_');
            filters.sortBy = sortBy;
            filters.sortOrder = sortOrder;
        }
        
        // Make API request
        const result = await apiRequest('get_products', {
            token: token,
            search: searchTerm,
            ...filters
        });
        
        console.log('Products API response:', result);
        
        if (result.success) {
            currentProducts = result.products || [];
            renderProductsTable(currentProducts);
            updateProductStats(result.count || 0);
        } else {
            throw new Error(result.error || 'Gagal memuat data produk');
        }
        
    } catch (error) {
        console.error('❌ Load products error:', error);
        
        const productsList = document.getElementById('products-list');
        if (productsList) {
            productsList.innerHTML = `
                <tr>
                    <td colspan="9" class="error-cell">
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <strong>Gagal memuat data produk</strong>
                                <p>${error.message}</p>
                                <button onclick="loadProductsData()" class="btn-retry">
                                    <i class="fas fa-redo"></i> Coba Lagi
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function renderProductsTable(products) {
    const productsList = document.getElementById('products-list');
    if (!productsList) return;
    
    if (products.length === 0) {
        productsList.innerHTML = `
            <tr>
                <td colspan="9" class="empty-cell">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>Tidak ada produk ditemukan</p>
                        <button onclick="showAddProductModal()" class="btn-add-first">
                            <i class="fas fa-plus"></i> Tambah Produk Pertama
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Apply pagination
    const pageSize = parseInt(document.getElementById('page-size-select')?.value || productsPerPage);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    // Update pagination controls
    updatePaginationControls(products.length, pageSize);
    
    // Render products
    productsList.innerHTML = paginatedProducts.map(product => `
        <tr class="product-row" data-product-id="${product.product_id}">
            <td>
                <div class="sku-cell">
                    <strong>${product.sku}</strong>
                    ${product.batch_number ? `<small>${product.batch_number}</small>` : ''}
                </div>
            </td>
            <td>
                <div class="product-name-cell">
                    <strong>${product.product_name}</strong>
                    ${product.warehouse_location ? `<small><i class="fas fa-map-marker-alt"></i> ${product.warehouse_location}</small>` : ''}
                </div>
            </td>
            <td>
                <span class="category-badge">${product.category}</span>
            </td>
            <td>
                ${renderStockCell(product.current_stock, product.min_stock)}
            </td>
            <td class="price-cell">
                ${formatCurrency(product.buy_price)}
            </td>
            <td class="price-cell">
                ${formatCurrency(product.sell_price)}
                ${product.min_price ? `<small>Min: ${formatCurrency(product.min_price)}</small>` : ''}
            </td>
            <td>
                ${renderExpiryCell(product.expiry_date)}
            </td>
            <td>
                ${renderStatusCell(product)}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewProduct('${product.product_id}')" title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="editProduct('${product.product_id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-qr" onclick="showQRCode('${product.product_id}')" title="QR Code">
                        <i class="fas fa-qrcode"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteProductPrompt('${product.product_id}', '${product.product_name}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderStockCell(currentStock, minStock) {
    let stockClass = 'stock-normal';
    let icon = 'fa-check';
    
    if (currentStock === 0) {
        stockClass = 'stock-out';
        icon = 'fa-times';
    } else if (currentStock <= minStock) {
        stockClass = 'stock-low';
        icon = 'fa-exclamation-triangle';
    } else if (currentStock <= minStock * 2) {
        stockClass = 'stock-warning';
        icon = 'fa-exclamation-circle';
    }
    
    return `
        <div class="stock-cell ${stockClass}">
            <i class="fas ${icon}"></i>
            <span>${currentStock}</span>
            ${currentStock <= minStock ? `<small>Min: ${minStock}</small>` : ''}
        </div>
    `;
}

function renderExpiryCell(expiryDate) {
    if (!expiryDate) return '<span class="no-expiry">Tidak ada</span>';
    
    const days = getDaysToExpiry(expiryDate);
    let expiryClass = 'expiry-normal';
    let text = formatDate(expiryDate);
    
    if (days < 0) {
        expiryClass = 'expiry-expired';
        text = `Kadaluarsa (${Math.abs(days)} hari)`;
    } else if (days <= 30) {
        expiryClass = 'expiry-soon';
        text = `${formatDate(expiryDate)} (${days} hari)`;
    } else if (days <= 60) {
        expiryClass = 'expiry-warning';
        text = `${formatDate(expiryDate)} (${days} hari)`;
    }
    
    return `<span class="expiry-date ${expiryClass}">${text}</span>`;
}

function renderStatusCell(product) {
    const statuses = [];
    
    if (product.current_stock === 0) {
        statuses.push('<span class="status-badge status-out">Habis</span>');
    } else if (product.current_stock <= product.min_stock) {
        statuses.push('<span class="status-badge status-low">Rendah</span>');
    }
    
    if (product.expiry_date) {
        const days = getDaysToExpiry(product.expiry_date);
        if (days <= 60) {
            statuses.push(`<span class="status-badge status-expiring">Exp ${days}d</span>`);
        }
        if (days <= 0) {
            statuses.push('<span class="status-badge status-expired">Expired</span>');
        }
    }
    
    if (statuses.length === 0) {
        statuses.push('<span class="status-badge status-ok">OK</span>');
    }
    
    return statuses.join(' ');
}

// ================================================
// PRODUCT CRUD OPERATIONS
// ================================================

async function createProduct(productData) {
    console.log('Creating product:', productData);
    
    try {
        const token = localStorage.getItem('youzi_token');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }
        
        showLoading('Membuat produk baru...');
        
        const result = await apiRequest('create_product', {
            token: token,
            ...productData
        });
        
        if (result.success) {
            showNotification('✅ Produk berhasil dibuat!', 'success');
            
            // Reload products list
            await loadProductsData();
            
            // Show QR code if generated
            if (result.qr_code_url) {
                showQRCodeModal(result.product_id, result.qr_code_url, result.sku);
            }
            
            return result;
        } else {
            throw new Error(result.error || 'Gagal membuat produk');
        }
        
    } catch (error) {
        console.error('❌ Create product error:', error);
        showNotification(`❌ Gagal membuat produk: ${error.message}`, 'error');
        return null;
    } finally {
        hideLoading();
    }
}

async function updateProduct(productId, updateData) {
    try {
        const token = localStorage.getItem('youzi_token');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }
        
        showLoading('Memperbarui produk...');
        
        const result = await apiRequest('update_product', {
            token: token,
            product_id: productId,
            ...updateData
        });
        
        if (result.success) {
            showNotification('✅ Produk berhasil diperbarui!', 'success');
            await loadProductsData();
            return result;
        } else {
            throw new Error(result.error || 'Gagal memperbarui produk');
        }
        
    } catch (error) {
        console.error('❌ Update product error:', error);
        showNotification(`❌ Gagal memperbarui produk: ${error.message}`, 'error');
        return null;
    } finally {
        hideLoading();
    }
}

async function deleteProduct(productId) {
    try {
        const token = localStorage.getItem('youzi_token');
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }
        
        showLoading('Menghapus produk...');
        
        const result = await apiRequest('delete_product', {
            token: token,
            product_id: productId
        });
        
        if (result.success) {
            showNotification('✅ Produk berhasil dihapus!', 'success');
            await loadProductsData();
            return result;
        } else {
            throw new Error(result.error || 'Gagal menghapus produk');
        }
        
    } catch (error) {
        console.error('❌ Delete product error:', error);
        showNotification(`❌ Gagal menghapus produk: ${error.message}`, 'error');
        return null;
    } finally {
        hideLoading();
    }
}

function deleteProductPrompt(productId, productName) {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
        deleteProduct(productId);
    }
}

// ================================================
// MODAL WINDOWS
// ================================================

function showAddProductModal() {
    const modalHTML = `
        <div class="modal active" id="add-product-modal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-plus"></i> Tambah Produk Baru</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="add-product-form" class="product-form">
                        <div class="form-section">
                            <h4><i class="fas fa-info-circle"></i> Informasi Dasar</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="product-name">Nama Produk *</label>
                                    <input type="text" id="product-name" required 
                                           placeholder="Contoh: Nasi Goreng Spesial">
                                </div>
                                <div class="form-group">
                                    <label for="product-category">Kategori *</label>
                                    <select id="product-category" required>
                                        <option value="">Pilih Kategori</option>
                                        <option value="Makanan">Makanan</option>
                                        <option value="Minuman">Minuman</option>
                                        <option value="Elektronik">Elektronik</option>
                                        <option value="Pakaian">Pakaian</option>
                                        <option value="Perlengkapan">Perlengkapan</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="product-description">Deskripsi</label>
                                    <textarea id="product-description" rows="2" 
                                              placeholder="Deskripsi singkat produk"></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="fas fa-money-bill-wave"></i> Harga</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="buy-price">Harga Beli (Rp) *</label>
                                    <input type="number" id="buy-price" required 
                                           min="0" step="100"
                                           placeholder="10000">
                                    <small>Harga dari supplier</small>
                                </div>
                                <div class="form-group">
                                    <label for="sell-price">Harga Jual (Rp)</label>
                                    <input type="number" id="sell-price" readonly
                                           placeholder="Otomatis">
                                    <small>Harga jual otomatis</small>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="min-price">Harga Minimum (Rp)</label>
                                    <input type="number" id="min-price" readonly
                                           placeholder="Otomatis">
                                </div>
                                <div class="form-group">
                                    <label for="max-price">Harga Maksimum (Rp)</label>
                                    <input type="number" id="max-price" readonly
                                           placeholder="Otomatis">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="fas fa-boxes"></i> Stok & Inventory</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="initial-stock">Stok Awal *</label>
                                    <input type="number" id="initial-stock" required
                                           min="0" value="0">
                                    <small>Jumlah stok saat pertama kali ditambahkan</small>
                                </div>
                                <div class="form-group">
                                    <label for="min-stock">Stok Minimum</label>
                                    <input type="number" id="min-stock" readonly
                                           placeholder="Otomatis">
                                    <small>Otomatis berdasarkan algoritma</small>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="warehouse-location">Lokasi Gudang</label>
                                    <input type="text" id="warehouse-location"
                                           placeholder="Contoh: Rak A1, Gudang Utama">
                                </div>
                                <div class="form-group">
                                    <label for="batch-number">Nomor Batch</label>
                                    <input type="text" id="batch-number"
                                           placeholder="Otomatis di-generate">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="fas fa-calendar-times"></i> Expiry & Lainnya</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="expiry-date">Tanggal Expiry</label>
                                    <input type="date" id="expiry-date">
                                    <small>Kosongkan jika tidak ada expiry</small>
                                </div>
                                <div class="form-group">
                                    <label for="supplier">Supplier</label>
                                    <select id="supplier">
                                        <option value="">Pilih Supplier</option>
                                        <option value="supplier1">Supplier Utama</option>
                                        <option value="supplier2">Supplier Alternatif</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="sku-preview">SKU Preview</label>
                                    <input type="text" id="sku-preview" readonly
                                           placeholder="Akan di-generate otomatis">
                                </div>
                                <div class="form-group">
                                    <label>QR Code</label>
                                    <div class="qr-preview" id="qr-preview">
                                        <i class="fas fa-qrcode"></i>
                                        <span>Akan di-generate otomatis</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">
                                Batal
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Simpan Produk
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupProductForm();
}

function setupProductForm() {
    const form = document.getElementById('add-product-form');
    if (!form) return;
    
    // Auto-calculate sell price when buy price changes
    const buyPriceInput = document.getElementById('buy-price');
    const sellPriceInput = document.getElementById('sell-price');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const minStockInput = document.getElementById('min-stock');
    const skuPreview = document.getElementById('sku-preview');
    
    if (buyPriceInput) {
        buyPriceInput.addEventListener('input', function() {
            const buyPrice = parseFloat(this.value) || 0;
            const margin = 30; // Default margin
            
            if (sellPriceInput) {
                const sellPrice = buyPrice * (1 + margin / 100);
                sellPriceInput.value = Math.round(sellPrice);
            }
            
            if (minPriceInput) {
                minPriceInput.value = Math.round(buyPrice * 1.1); // 10% min
            }
            
            if (maxPriceInput) {
                maxPriceInput.value = Math.round(buyPrice * 1.5); // 50% max
            }
        });
    }
    
    // Auto-generate SKU preview
    const nameInput = document.getElementById('product-name');
    const categorySelect = document.getElementById('product-category');
    const expiryInput = document.getElementById('expiry-date');
    
    function updateSKUPreview() {
        const name = nameInput?.value || '';
        const category = categorySelect?.value || '';
        const expiry = expiryInput?.value || '';
        
        if (name && category) {
            // Simple SKU preview (actual generation is done on server)
            const categoryCode = category.substring(0, 3).toUpperCase();
            const nameCode = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
            const expiryCode = expiry ? formatDateForSKU(expiry) : '000000';
            
            skuPreview.value = `${categoryCode}-${nameCode}-${expiryCode}-001`;
        }
    }
    
    if (nameInput) nameInput.addEventListener('input', updateSKUPreview);
    if (categorySelect) categorySelect.addEventListener('change', updateSKUPreview);
    if (expiryInput) expiryInput.addEventListener('change', updateSKUPreview);
    
    // Auto-calculate min stock
    function updateMinStock() {
        const category = categorySelect?.value || '';
        const baseStocks = {
            'Makanan': 20,
            'Minuman': 30,
            'Elektronik': 5,
            'Pakaian': 15,
            'Perlengkapan': 10
        };
        
        if (minStockInput && category) {
            minStockInput.value = baseStocks[category] || 10;
        }
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', updateMinStock);
    }
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const productData = {
            product_name: document.getElementById('product-name').value,
            category: document.getElementById('product-category').value,
            buy_price: document.getElementById('buy-price').value,
            initial_stock: document.getElementById('initial-stock').value,
            warehouse_location: document.getElementById('warehouse-location').value,
            expiry_date: document.getElementById('expiry-date').value,
            supplier: document.getElementById('supplier').value,
            batch_number: document.getElementById('batch-number').value || generateBatchNumber(),
            description: document.getElementById('product-description').value
        };
        
        // Validate
        if (!productData.product_name || !productData.category || !productData.buy_price) {
            showNotification('Harap isi semua field yang wajib diisi', 'warning');
            return;
        }
        
        // Create product
        const result = await createProduct(productData);
        if (result) {
            closeModal();
        }
    });
}

function showQRCode(productId) {
    // For now, show a placeholder modal
    const modalHTML = `
        <div class="modal active" id="qr-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-qrcode"></i> QR Code Produk</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="qr-code-container">
                        <div class="qr-code-placeholder">
                            <i class="fas fa-qrcode"></i>
                            <p>QR Code akan di-generate otomatis</p>
                        </div>
                        <div class="qr-actions">
                            <button class="btn btn-primary">
                                <i class="fas fa-print"></i> Cetak Label
                            </button>
                            <button class="btn btn-secondary">
                                <i class="fas fa-download"></i> Download QR
                            </button>
                            <button class="btn btn-info" onclick="copyQRData()">
                                <i class="fas fa-copy"></i> Copy Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.remove());
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

function updateProductStats(count) {
    const countElement = document.getElementById('product-count');
    if (countElement) {
        countElement.textContent = `${count} produk ditemukan`;
    }
    
    // Update stock indicators
    const lowStockCount = currentProducts.filter(p => 
        p.current_stock > 0 && p.current_stock <= p.min_stock
    ).length;
    
    const expiringCount = currentProducts.filter(p => {
        if (!p.expiry_date) return false;
        const days = getDaysToExpiry(p.expiry_date);
        return days > 0 && days <= 60;
    }).length;
    
    document.querySelectorAll('.stock-indicator.low').forEach(el => {
        el.textContent = lowStockCount;
    });
    
    document.querySelectorAll('.stock-indicator.expiring').forEach(el => {
        el.textContent = expiringCount;
    });
}

function updatePaginationControls(totalItems, pageSize) {
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // Update page info
    const pageInfo = document.getElementById('page-info');
    if (pageInfo) {
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    }
    
    // Update button states
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    if (prevButton) {
        prevButton.disabled = currentPage <= 1;
    }
    
    if (nextButton) {
        nextButton.disabled = currentPage >= totalPages;
    }
}

function formatCurrency(amount) {
    if (!amount) return 'Rp 0';
    return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateForSKU(dateString) {
    if (!dateString) return '000000';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().substring(2);
    return day + month + year;
}

function getDaysToExpiry(expiryDate) {
    if (!expiryDate) return Infinity;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function generateBatchNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substring(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BATCH-${year}${month}${day}-${random}`;
}

// ================================================
// EVENT HANDLERS
// ================================================

function setupProductsPageEvents() {
    console.log('Setting up products page events...');
    
    // Search input
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadProductsData();
            }, 500);
        });
    }
    
    // Filter changes
    const filters = ['category-filter', 'stock-filter', 'sort-filter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', loadProductsData);
        }
    });
    
    // Add product button
    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddProductModal);
    }
    
    // Pagination buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderProductsTable(currentProducts);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const pageSize = parseInt(document.getElementById('page-size-select')?.value || productsPerPage);
            const totalPages = Math.ceil(currentProducts.length / pageSize);
            
            if (currentPage < totalPages) {
                currentPage++;
                renderProductsTable(currentProducts);
            }
        });
    }
    
    // Page size selector
    const pageSizeSelect = document.getElementById('page-size-select');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            currentPage = 1;
            renderProductsTable(currentProducts);
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('export-products-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportProducts);
    }
    
    // Print labels button
    const printBtn = document.getElementById('print-labels-btn');
    if (printBtn) {
        printBtn.addEventListener('click', printProductLabels);
    }
}

async function exportProducts() {
    showLoading('Mengekspor data produk...');
    
    try {
        // Create CSV content
        const headers = ['SKU', 'Nama Produk', 'Kategori', 'Stok', 'Harga Beli', 'Harga Jual', 'Expiry Date', 'Status'];
        const rows = currentProducts.map(product => [
            product.sku,
            product.product_name,
            product.category,
            product.current_stock,
            product.buy_price,
            product.sell_price,
            product.expiry_date ? formatDate(product.expiry_date) : '',
            product.current_stock === 0 ? 'Habis' : 
            product.current_stock <= product.min_stock ? 'Rendah' : 'OK'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('✅ Data produk berhasil diekspor!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('❌ Gagal mengekspor data', 'error');
    } finally {
        hideLoading();
    }
}

function printProductLabels() {
    showNotification('Fitur print label akan segera tersedia', 'info');
    // TODO: Implement label printing with QR codes
}

// ================================================
// INITIALIZATION
// ================================================

// Make functions available globally
window.loadProductsPage = loadProductsPage;
window.showAddProductModal = showAddProductModal;
window.editProduct = function(productId) {
    showNotification('Fitur edit akan segera tersedia', 'info');
};
window.viewProduct = function(productId) {
    showNotification('Fitur detail produk akan segera tersedia', 'info');
};
window.deleteProductPrompt = deleteProductPrompt;
window.closeModal = closeModal;
