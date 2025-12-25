// File: js/auth.js - COMPLETE VERSION
// ================================================
// YOUZI CORP - FRONTEND AUTHENTICATION
// ================================================

// Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbwOXpLlyyHLrLk-RxuldWdZYSghJkk71m9kDIEmG7jvcnpviQ--n1J_GLgphLiw-MhM/exec";

// Global state
let currentUser = null;
let authToken = localStorage.getItem('youzi_token');
let apiStatus = 'unknown';

// ================================================
// CORE API FUNCTIONS
// ================================================

/**
 * Universal API request handler
 * @param {string} action - API action name
 * @param {Object} data - Request data
 * @param {string} method - HTTP method
 * @returns {Promise} API response
 */
async function apiRequest(action, data = {}, method = 'POST') {
    const requestId = 'req_' + Date.now() + Math.random().toString(36).substr(2, 9);
    
    console.group(`📡 API Request [${requestId}]`);
    console.log('Action:', action);
    console.log('Method:', method);
    console.log('Data:', data);
    
    try {
        let url = API_URL;
        let options = {
            method: method,
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit'
        };
        
        // Add authorization header if token exists
        if (authToken && !['login', 'register', 'test', 'health'].includes(action)) {
            options.headers = {
                ...options.headers,
                'Authorization': 'Bearer ' + authToken
            };
        }
        
        // Handle different HTTP methods
        if (method === 'GET') {
            const params = new URLSearchParams({ action, ...data });
            url += '?' + params.toString();
        } else {
            // POST, PUT, DELETE
            const formData = new URLSearchParams();
            formData.append('action', action);
            
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key].toString());
                }
            });
            
            options.headers = {
                ...options.headers,
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            options.body = formData.toString();
        }
        
        console.log('Request URL:', url);
        console.log('Request options:', options);
        
        // Make the request
        const response = await fetch(url, options);
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Parse response
        let result;
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.log('Raw response text:', text);
            
            try {
                result = JSON.parse(text);
            } catch {
                result = {
                    success: false,
                    error: 'Invalid JSON response',
                    raw: text
                };
            }
        }
        
        console.log('Response data:', result);
        
        // Handle specific status codes
        if (response.status === 401) {
            // Unauthorized - clear local storage
            localStorage.removeItem('youzi_token');
            localStorage.removeItem('youzi_user');
            authToken = null;
            currentUser = null;
            
            if (window.location.hash !== '#login') {
                showNotification('Sesi telah berakhir, silakan login kembali', 'warning');
                switchToLogin();
            }
        }
        
        console.groupEnd();
        return result;
        
    } catch (error) {
        console.error('❌ API Request failed:', error);
        console.groupEnd();
        
        // Return mock data for development if API is unreachable
        if (apiStatus === 'offline' || error.message.includes('Failed to fetch')) {
            return getMockResponse(action, data);
        }
        
        return {
            success: false,
            error: 'Koneksi gagal: ' + error.message,
            code: 'NETWORK_ERROR'
        };
    }
}

/**
 * Check API health status
 */
async function checkApiHealth() {
    try {
        console.log('🔍 Checking API health...');
        const result = await apiRequest('health', {}, 'GET');
        
        if (result && result.status === 'healthy') {
            apiStatus = 'online';
            console.log('✅ API is online');
            return true;
        } else {
            apiStatus = 'degraded';
            console.warn('⚠️ API is degraded');
            return false;
        }
    } catch (error) {
        apiStatus = 'offline';
        console.error('❌ API is offline:', error);
        return false;
    }
}

/**
 * Get mock response for development
 */
function getMockResponse(action, data) {
    console.log(`🔄 Using mock response for: ${action}`);
    
    const mockResponses = {
        'test': {
            success: true,
            message: "Youzi Corp API (Mock Mode)",
            timestamp: new Date().toISOString(),
            version: "1.0.0-mock",
            mode: "MOCK"
        },
        
        'login': {
            success: true,
            token: "mock_jwt_" + Date.now(),
            user: {
                user_id: "USER-" + Date.now(),
                email: data.email || "user@youzicorp.com",
                full_name: data.email === "admin@youzicorp.com" ? "Administrator" : "Demo User",
                role: data.email.includes("admin") ? "admin" : 
                      data.email.includes("manager") ? "manager" : 
                      data.email.includes("gudang") ? "gudang" : 
                      data.email.includes("keuangan") ? "keuangan" : "sales",
                department: "IT",
                transaction_limit: data.email === "admin@youzicorp.com" ? 0 : 3000000,
                permissions: {
                    product_view: true,
                    product_create: data.email === "admin@youzicorp.com",
                    product_edit: data.email === "admin@youzicorp.com",
                    product_delete: data.email === "admin@youzicorp.com",
                    inventory_view: true,
                    stock_in: true,
                    stock_out: true,
                    stock_opname: data.email === "admin@youzicorp.com" || data.email.includes("gudang"),
                    sales_create: true,
                    sales_view: true,
                    financial_view: true,
                    reports_view: true,
                    reports_export: data.email === "admin@youzicorp.com" || data.email.includes("manager"),
                    users_view: data.email === "admin@youzicorp.com",
                    users_manage: data.email === "admin@youzicorp.com",
                    settings_manage: data.email === "admin@youzicorp.com"
                }
            }
        },
        
        'register': {
            success: true,
            token: "mock_jwt_" + Date.now(),
            user: {
                user_id: "USER-" + Date.now(),
                email: data.email || "newuser@youzicorp.com",
                full_name: data.full_name || "New User",
                role: data.role || "sales",
                department: data.department || "Sales",
                transaction_limit: data.role === "admin" ? 0 : 3000000,
                permissions: getMockPermissions(data.role || "sales")
            }
        },
        
        'validate': {
            success: true,
            authenticated: true,
            user: {
                user_id: "USER-123456",
                email: "admin@youzicorp.com",
                role: "admin",
                permissions: { all_permissions: true }
            }
        },
        
        'profile': {
            success: true,
            user: {
                user_id: "USER-123456",
                email: "admin@youzicorp.com",
                full_name: "Administrator",
                role: "admin",
                department: "IT",
                transaction_limit: 0,
                permissions: { all_permissions: true }
            }
        }
    };
    
    return mockResponses[action] || {
        success: false,
        error: `Mock response not defined for action: ${action}`
    };
}

function getMockPermissions(role) {
    const basePermissions = {
        product_view: true,
        inventory_view: true,
        sales_view: true
    };
    
    if (role === 'admin') {
        return { ...basePermissions, all_permissions: true };
    }
    
    return basePermissions;
}

// ================================================
// AUTHENTICATION FUNCTIONS
// ================================================

/**
 * Login user with email and password
 */
async function login(email, password) {
    showLoading('Memproses login...');
    
    try {
        console.log('🔐 Attempting login for:', email);
        
        const result = await apiRequest('login', { email, password });
        
        if (result && result.success) {
            // Save authentication data
            authToken = result.token;
            currentUser = result.user;
            
            localStorage.setItem('youzi_token', authToken);
            localStorage.setItem('youzi_user', JSON.stringify(currentUser));
            
            console.log('✅ Login successful:', currentUser);
            
            // Switch to dashboard
            switchToDashboard();
            
            // Initialize dashboard
            initializeDashboard();
            
            // Show welcome notification
            showNotification(
                `Selamat datang, ${currentUser.full_name}!`, 
                'success'
            );
            
            return { success: true };
        } else {
            const errorMsg = result?.error || 'Login gagal. Periksa email dan password.';
            console.error('❌ Login failed:', errorMsg);
            showNotification(errorMsg, 'error');
            
            return {
                success: false,
                error: errorMsg
            };
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showNotification('Terjadi kesalahan saat login', 'error');
        
        return {
            success: false,
            error: error.message
        };
    } finally {
        hideLoading();
    }
}

/**
 * Register new user
 */
async function register(userData) {
    showLoading('Mendaftarkan pengguna...');
    
    try {
        console.log('📝 Registering user:', userData.email);
        
        const result = await apiRequest('register', userData);
        
        if (result && result.success) {
            // Auto login after registration
            authToken = result.token;
            currentUser = result.user;
            
            localStorage.setItem('youzi_token', authToken);
            localStorage.setItem('youzi_user', JSON.stringify(currentUser));
            
            console.log('✅ Registration successful:', currentUser);
            
            // Switch to dashboard
            switchToDashboard();
            initializeDashboard();
            
            showNotification(
                `Pendaftaran berhasil! Selamat datang ${currentUser.full_name}`,
                'success'
            );
            
            return { success: true };
        } else {
            const errorMsg = result?.error || 'Pendaftaran gagal';
            console.error('❌ Registration failed:', errorMsg);
            showNotification(errorMsg, 'error');
            
            return {
                success: false,
                error: errorMsg
            };
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        showNotification('Terjadi kesalahan saat pendaftaran', 'error');
        
        return {
            success: false,
            error: error.message
        };
    } finally {
        hideLoading();
    }
}

/**
 * Logout current user
 */
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        console.log('👋 Logging out user:', currentUser?.email);
        
        // Clear local storage
        localStorage.removeItem('youzi_token');
        localStorage.removeItem('youzi_user');
        
        // Clear global state
        authToken = null;
        currentUser = null;
        
        // Switch to login screen
        switchToLogin();
        
        showNotification('Anda telah logout', 'info');
    }
}

/**
 * Validate current session
 */
async function validateSession() {
    if (!authToken) return false;
    
    try {
        const result = await apiRequest('validate', { token: authToken });
        return result?.success === true;
    } catch (error) {
        console.error('Session validation error:', error);
        return false;
    }
}

/**
 * Get current user permissions
 */
function getUserPermissions() {
    return currentUser?.permissions || {};
}

/**
 * Check if user has specific permission
 */
function hasPermission(permissionName) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    const permissions = currentUser.permissions || {};
    return permissions[permissionName] === true;
}

// ================================================
// UI MANAGEMENT FUNCTIONS
// ================================================

/**
 * Switch to login screen
 */
function switchToLogin() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen && dashboardScreen) {
        loginScreen.classList.add('active');
        dashboardScreen.classList.remove('active');
        
        // Clear login form
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        // Set focus to email field
        setTimeout(() => {
            if (emailInput) emailInput.focus();
        }, 100);
    }
}

/**
 * Switch to dashboard screen
 */
function switchToDashboard() {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen && dashboardScreen) {
        loginScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        
        // Update user info in sidebar
        updateUserInfo();
        
        // Set initial page
        switchPage('dashboard');
    }
}

/**
 * Update user info in sidebar
 */
function updateUserInfo() {
    if (!currentUser) return;
    
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    
    if (userNameEl) {
        userNameEl.textContent = currentUser.full_name;
    }
    
    if (userRoleEl) {
        const roleNames = {
            'admin': 'Administrator',
            'manager': 'Manager',
            'gudang': 'Staff Gudang',
            'sales': 'Sales',
            'keuangan': 'Staff Keuangan'
        };
        
        userRoleEl.textContent = roleNames[currentUser.role] || currentUser.role;
        userRoleEl.className = `user-role role-${currentUser.role}`;
    }
}

/**
 * Switch between pages
 */
function switchPage(pageName) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    const pageTitles = {
        'dashboard': 'Dashboard',
        'products': 'Manajemen Produk',
        'inventory': 'Inventory',
        'sales': 'Penjualan',
        'reports': 'Laporan',
        'users': 'Manajemen User',
        'settings': 'Pengaturan'
    };
    
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) {
        pageTitleEl.textContent = pageTitles[pageName] || pageName;
    }
    
    // Show selected page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Load page content if needed
    loadPageContent(pageName);
}

/**
 * Load content for specific page
 */
function loadPageContent(pageName) {
    switch(pageName) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'products':
            loadProductsPage();
            break;
        case 'inventory':
            loadInventoryPage();
            break;
        // Add other pages as needed
    }
}

// ================================================
// EVENT HANDLERS
// ================================================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Login form
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Login form enter key
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            switchPage(page);
        });
    });
    
    // Dark mode toggle
    const darkModeSwitch = document.getElementById('dark-mode-switch');
    if (darkModeSwitch) {
        darkModeSwitch.addEventListener('change', function() {
            if (this.checked) {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
    
    // QR Scan button
    const qrScanBtn = document.getElementById('quick-scan');
    if (qrScanBtn) {
        qrScanBtn.addEventListener('click', openQRScanner);
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    console.log('✅ Event listeners setup complete');
}

/**
 * Handle login form submission
 */
async function handleLogin() {
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    
    if (!email) {
        showNotification('Email harus diisi', 'warning');
        document.getElementById('email')?.focus();
        return;
    }
    
    if (!password) {
        showNotification('Password harus diisi', 'warning');
        document.getElementById('password')?.focus();
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Format email tidak valid', 'warning');
        return;
    }
    
    await login(email, password);
}

/**
 * Toggle sidebar collapsed state
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const isCollapsed = sidebar.classList.contains('collapsed');
    
    if (isCollapsed) {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
    } else {
        sidebar.classList.add('collapsed');
        localStorage.setItem('sidebarCollapsed', 'true');
    }
}

// ================================================
// UI UTILITY FUNCTIONS
// ================================================

/**
 * Show loading overlay
 */
function showLoading(message = 'Memuat...') {
    let overlay = document.getElementById('loading-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 1.2rem;
            flex-direction: column;
            backdrop-filter: blur(3px);
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="spinner" style="
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #3498db;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        "></div>
        <div>${message}</div>
    `;
    
    // Add spinner animation if not exists
    if (!document.getElementById('spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    overlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set styles
    const bgColor = {
        'success': '#d4edda',
        'error': '#f8d7da',
        'warning': '#fff3cd',
        'info': '#d1ecf1'
    }[type] || '#d1ecf1';
    
    const textColor = {
        'success': '#155724',
        'error': '#721c24',
        'warning': '#856404',
        'info': '#0c5460'
    }[type] || '#0c5460';
    
    const icon = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    }[type] || 'info-circle';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: ${textColor};
        border: 1px solid ${textColor}20;
        border-radius: 8px;
        padding: 15px 20px;
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideIn 0.3s ease;
        font-family: 'Inter', sans-serif;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <i class="fas fa-${icon}" style="font-size: 1.2rem;"></i>
            <span style="flex: 1;">${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.4rem;
            color: inherit;
            opacity: 0.7;
            padding: 0 5px;
            margin-left: 10px;
        ">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    // Add animations if not exists
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
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
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ================================================
// INITIALIZATION
// ================================================

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('🚀 Initializing Youzi Corp Inventory System...');
    
    // Check API health
    await checkApiHealth();
    
    // Set dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
        const darkModeSwitch = document.getElementById('dark-mode-switch');
        if (darkModeSwitch) darkModeSwitch.checked = true;
    }
    
    // Set sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.sidebar')?.classList.add('collapsed');
    }
    
    // Check authentication
    const storedToken = localStorage.getItem('youzi_token');
    const storedUser = localStorage.getItem('youzi_user');
    
    if (storedToken && storedUser) {
        try {
            authToken = storedToken;
            currentUser = JSON.parse(storedUser);
            
            // Validate session
            const isValid = await validateSession();
            
            if (isValid) {
                console.log('✅ Valid session found');
                switchToDashboard();
                initializeDashboard();
            } else {
                console.log('❌ Invalid session');
                switchToLogin();
            }
        } catch (error) {
            console.error('Session restore error:', error);
            switchToLogin();
        }
    } else {
        console.log('ℹ️ No session found');
        switchToLogin();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Test API connection
    try {
        const testResult = await apiRequest('test', {}, 'GET');
        console.log('🌐 API Connection test:', testResult);
        
        if (apiStatus === 'online') {
            showNotification('Sistem siap digunakan', 'success', 3000);
        } else if (apiStatus === 'offline') {
            showNotification('Mode offline aktif - data demo digunakan', 'warning', 5000);
        }
    } catch (error) {
        console.warn('⚠️ API test failed:', error);
    }
    
    console.log('✅ App initialization complete');
}

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    console.log('📊 Initializing dashboard...');
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Load recent activity
    loadRecentActivity();
    
    // Update notification count
    updateNotificationCount();
}

// ================================================
// DASHBOARD FUNCTIONS (Placeholders)
// ================================================

async function updateDashboardStats() {
    // Placeholder - will be implemented with real data
    const stats = {
        totalProducts: 156,
        todaySales: 'Rp 12.450.000',
        lowStock: 8,
        expiringSoon: 15
    };
    
    document.getElementById('total-products')?.textContent = stats.totalProducts;
    document.getElementById('total-sales')?.textContent = stats.todaySales;
    document.getElementById('low-stock')?.textContent = stats.lowStock;
    document.getElementById('expiring-soon')?.textContent = stats.expiringSoon;
}

function loadRecentActivity() {
    const activities = [
        { icon: 'fa-box', text: 'Produk "Nasi Goreng Spesial" ditambahkan', time: '2 jam lalu' },
        { icon: 'fa-shopping-cart', text: 'Transaksi penjualan #TRX-001 berhasil', time: '4 jam lalu' },
        { icon: 'fa-exclamation-triangle', text: 'Stok "Mie Instan" mencapai batas minimum', time: '1 hari lalu' },
        { icon: 'fa-user', text: 'User baru "John Doe" didaftarkan', time: '2 hari lalu' }
    ];
    
    const activityList = document.getElementById('recent-activity');
    if (activityList) {
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }
}

function updateNotificationCount() {
    // Placeholder - will be implemented
    const count = 3;
    const badge = document.getElementById('notification-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ================================================
// QR CODE SCANNER (Placeholder)
// ================================================

function openQRScanner() {
    showNotification('Fitur QR Scanner akan segera tersedia', 'info');
    // Implementation will be added in Phase 3
}

// ================================================
// PAGE LOADERS (Placeholders)
// ================================================

function loadDashboardContent() {
    // Already handled by initializeDashboard
}

function loadProductsPage() {
    const pageContent = document.getElementById('page-products');
    if (!pageContent) return;
    
    pageContent.innerHTML = `
        <div class="page-header">
            <h2>Manajemen Produk</h2>
            <p>Kelola data produk, stok, dan harga</p>
        </div>
        
        <div class="placeholder-content" style="
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary);
        ">
            <i class="fas fa-box-open" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;"></i>
            <h3 style="margin-bottom: 10px;">Fitur Produk</h3>
            <p>Halaman manajemen produk akan segera tersedia di Phase 3</p>
            <p style="margin-top: 20px; font-size: 0.9rem;">
                Fitur yang akan datang:<br>
                • Tambah/Edit/Hapus Produk<br>
                • Generate SKU Otomatis<br>
                • QR Code Generator<br>
                • Manajemen Stok
            </p>
        </div>
    `;
}

function loadInventoryPage() {
    const pageContent = document.getElementById('page-inventory');
    if (!pageContent) return;
    
    pageContent.innerHTML = `
        <div class="page-header">
            <h2>Manajemen Inventory</h2>
            <p>Kelola stok, transaksi masuk/keluar, dan stock opname</p>
        </div>
        
        <div class="placeholder-content" style="
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary);
        ">
            <i class="fas fa-warehouse" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;"></i>
            <h3 style="margin-bottom: 10px;">Fitur Inventory</h3>
            <p>Halaman manajemen inventory akan segera tersedia di Phase 4</p>
        </div>
    `;
}

// ================================================
// START THE APPLICATION
// ================================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Make functions available globally for HTML event handlers
window.login = login;
window.logout = logout;
window.switchPage = switchPage;
window.showNotification = showNotification;
window.openQRScanner = openQRScanner;
