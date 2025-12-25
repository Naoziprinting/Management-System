// File: js/auth.js - UPDATE LOGIN FUNCTION ERROR HANDLING
console.log('🚀 auth.js loaded successfully!');

// ================================================
// CONFIGURATION
// ================================================

const API_URL = "https://script.google.com/macros/s/AKfycbwOXpLlyyHLrLk-RxuldWdZYSghJkk71m9kDIEmG7jvcnpviQ--n1J_GLgphLiw-MhM/exec";

// Global state
let currentUser = null;
let authToken = localStorage.getItem('youzi_token');

// ================================================
// API FUNCTIONS
// ================================================

async function apiRequest(action, data = {}) {
    console.log(`📡 API Request: ${action}`, data);
    
    try {
        // Build URL with parameters
        const url = new URL(API_URL);
        url.searchParams.append('action', action);
        
        // Add all data parameters
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                url.searchParams.append(key, data[key].toString());
            }
        });
        
        console.log('Final URL:', url.toString());
        
        // Make GET request
        const response = await fetch(url.toString(), {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        return result;
        
    } catch (error) {
        console.error('❌ API Request failed:', error);
        return {
            success: false,
            error: 'Network error: ' + error.message
        };
    }
}

// ================================================
// LOGIN FUNCTION - UPDATED ERROR HANDLING
// ================================================

async function login(email, password) {
    console.log('🔐 Login attempt for:', email);
    
    // Show loading
    showLoading('Memproses login...');
    
    try {
        const result = await apiRequest('login', { 
            email: email.trim(), 
            password: password 
        });
        
        console.log('Login API response:', result);
        
        if (result && result.success === true) {
            // Save authentication data
            authToken = result.token;
            currentUser = result.user;
            
            localStorage.setItem('youzi_token', authToken);
            localStorage.setItem('youzi_user', JSON.stringify(currentUser));
            
            console.log('✅ Login successful! User:', currentUser);
            
            // Switch to dashboard
            switchToDashboard();
            
            // Show success notification
            showNotification(
                `Selamat datang, ${currentUser.full_name}!`, 
                'success'
            );
            
            return { success: true };
            
        } else {
            // FIXED: Handle API error properly
            let errorMsg = 'Login gagal. Periksa email dan password.';
            
            if (result && result.error) {
                // Check if error is from Google Apps Script
                if (result.error.includes('ReferenceError')) {
                    errorMsg = 'Server error. Silakan coba lagi atau hubungi administrator.';
                    console.error('Server script error:', result.error);
                } else {
                    errorMsg = result.error;
                }
            }
            
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

// ================================================
// FALLBACK LOGIN FUNCTION (DIRECT API CALL)
// ================================================

async function fallbackLogin(email, password) {
    console.log('🔄 Using fallback login for:', email);
    
    try {
        const url = `${API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        
        const response = await fetch(url);
        const text = await response.text();
        
        console.log('Fallback response text:', text);
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return {
                success: false,
                error: 'Invalid server response'
            };
        }
        
        if (data && data.success) {
            localStorage.setItem('youzi_token', data.token);
            localStorage.setItem('youzi_user', JSON.stringify(data.user));
            
            // Switch to dashboard
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard-screen').style.display = 'block';
            
            // Update user info
            document.getElementById('user-name').textContent = data.user.full_name;
            document.getElementById('user-role').textContent = data.user.role;
            
            showNotification(`Selamat datang, ${data.user.full_name}!`, 'success');
            
            return { success: true };
        } else {
            const errorMsg = data?.error || 'Login gagal';
            showNotification(errorMsg, 'error');
            return { success: false, error: errorMsg };
        }
        
    } catch (error) {
        console.error('Fallback login error:', error);
        showNotification('Koneksi error. Coba refresh halaman.', 'error');
        return { success: false, error: error.message };
    }
}

// ================================================
// HANDLE LOGIN FORM SUBMISSION - WITH FALLBACK
// ================================================

async function handleLoginForm() {
    console.log('🎯 handleLoginForm() called');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        showNotification('Form tidak lengkap', 'error');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    console.log('Form values:', { email, password });
    
    // Validation
    if (!email) {
        showNotification('Email harus diisi', 'warning');
        emailInput.focus();
        return;
    }
    
    if (!password) {
        showNotification('Password harus diisi', 'warning');
        passwordInput.focus();
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Format email tidak valid', 'warning');
        emailInput.focus();
        return;
    }
    
    // Try main login function first
    const result = await login(email, password);
    
    // If failed due to server error, try fallback
    if (!result.success && result.error && result.error.includes('Server error')) {
        console.log('Trying fallback login...');
        await fallbackLogin(email, password);
    }
}

// ================================================
// UI FUNCTIONS (Tetap sama)
// ================================================

function switchToLogin() {
    console.log('🔄 Switching to login screen');
    
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) {
        loginScreen.classList.add('active');
        loginScreen.style.display = 'block';
    }
    
    if (dashboardScreen) {
        dashboardScreen.classList.remove('active');
        dashboardScreen.style.display = 'none';
    }
}

function switchToDashboard() {
    console.log('🔄 Switching to dashboard');
    
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) {
        loginScreen.classList.remove('active');
        loginScreen.style.display = 'none';
    }
    
    if (dashboardScreen) {
        dashboardScreen.classList.add('active');
        dashboardScreen.style.display = 'block';
    }
    
    // Update user info
    updateUserInfo();
}

function updateUserInfo() {
    if (!currentUser) {
        console.warn('No current user to update');
        return;
    }
    
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
    }
}

function showLoading(message) {
    console.log('⏳ Loading:', message);
    
    // Remove existing loading
    hideLoading();
    
    // Create loading overlay
    const loadingEl = document.createElement('div');
    loadingEl.id = 'loading-overlay';
    loadingEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-family: 'Inter', sans-serif;
        font-size: 18px;
    `;
    
    loadingEl.innerHTML = `
        <div class="spinner" style="
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 5px solid #3498db;
            margin-bottom: 20px;
            animation: spin 1s linear infinite;
        "></div>
        <div>${message}</div>
    `;
    
    document.body.appendChild(loadingEl);
}

function hideLoading() {
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) {
        loadingEl.remove();
    }
}

function showNotification(message, type = 'info') {
    console.log(`💬 Notification [${type}]:`, message);
    
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Set styles based on type
    const styles = {
        'success': {
            background: '#2ecc71',
            color: 'white',
            icon: 'check-circle'
        },
        'error': {
            background: '#e74c3c',
            color: 'white',
            icon: 'exclamation-circle'
        },
        'warning': {
            background: '#f39c12',
            color: 'white',
            icon: 'exclamation-triangle'
        },
        'info': {
            background: '#3498db',
            color: 'white',
            icon: 'info-circle'
        }
    };
    
    const style = styles[type] || styles.info;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${style.background};
        color: ${style.color};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 300px;
        max-width: 400px;
        font-family: 'Inter', sans-serif;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${style.icon}" style="font-size: 1.2rem;"></i>
        <span style="flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 1.4rem;
            padding: 0 5px;
        ">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ================================================
// EVENT HANDLERS
// ================================================

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        console.log('✅ Found login button');
        // Remove existing listeners first
        loginBtn.removeEventListener('click', handleLoginForm);
        loginBtn.addEventListener('click', handleLoginForm);
        console.log('✅ Added click listener to login button');
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                localStorage.removeItem('youzi_token');
                localStorage.removeItem('youzi_user');
                window.location.reload();
            }
        });
    }
    
    // Test user buttons
    const testButtons = document.querySelectorAll('.btn-test-user');
    testButtons.forEach(button => {
        button.addEventListener('click', function() {
            const email = this.dataset.email;
            const password = this.dataset.password;
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (emailInput) emailInput.value = email;
            if (passwordInput) passwordInput.value = password;
            
            console.log(`✅ Auto-filled: ${email}`);
            showNotification(`Form diisi untuk: ${email}`, 'info');
        });
    });
    
    // Enter key on password field
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLoginForm();
            }
        });
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            console.log('Navigating to page:', page);
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked
            this.classList.add('active');
            
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
            
            document.getElementById('page-title').textContent = pageTitles[page] || page;
            
            // Show selected page
            document.querySelectorAll('.page').forEach(pageEl => {
                pageEl.classList.remove('active');
            });
            
            const targetPage = document.getElementById(`page-${page}`);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Load page content if needed
            if (page === 'products' && typeof loadProductsPage === 'function') {
                loadProductsPage();
            }
        });
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('collapsed');
        });
    }
    
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
    
    console.log('✅ Event listeners setup complete');
}

// ================================================
// INITIALIZATION
// ================================================

function initializeApp() {
    console.log('🚀 Initializing Youzi Corp Inventory System...');
    
    // Check dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
        const darkModeSwitch = document.getElementById('dark-mode-switch');
        if (darkModeSwitch) darkModeSwitch.checked = true;
    }
    
    // Check if user is already logged in
    const storedToken = localStorage.getItem('youzi_token');
    const storedUser = localStorage.getItem('youzi_user');
    
    if (storedToken && storedUser) {
        try {
            authToken = storedToken;
            currentUser = JSON.parse(storedUser);
            
            console.log('✅ Found stored user:', currentUser.email);
            
            // Show dashboard
            switchToDashboard();
            
        } catch (error) {
            console.error('❌ Error restoring session:', error);
            localStorage.clear();
            switchToLogin();
        }
    } else {
        console.log('ℹ️ No stored session found');
        switchToLogin();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Test API connection
    testAPIConnection();
}

async function testAPIConnection() {
    console.log('🌐 Testing API connection...');
    
    try {
        const result = await apiRequest('test');
        console.log('API Test Result:', result);
        
        if (result && result.success) {
            showNotification('✅ API terhubung dengan baik', 'success', 3000);
            return true;
        } else {
            showNotification('⚠️ API tidak merespon dengan benar', 'warning', 5000);
            return false;
        }
    } catch (error) {
        console.error('❌ API test failed:', error);
        showNotification('❌ Tidak dapat terhubung ke server', 'error', 5000);
        return false;
    }
}

// ================================================
// DASHBOARD FUNCTIONS
// ================================================

function initializeDashboard() {
    console.log('📊 Initializing dashboard...');
    
    // Update user info
    updateUserInfo();
    
    // Load dashboard data
    updateDashboardStats();
    loadRecentActivity();
}

function updateDashboardStats() {
    // Mock data for now
    const stats = {
        totalProducts: 156,
        todaySales: 'Rp 12.450.000',
        lowStock: 8,
        expiringSoon: 15
    };
    
    const totalProductsEl = document.getElementById('total-products');
    const totalSalesEl = document.getElementById('total-sales');
    const lowStockEl = document.getElementById('low-stock');
    const expiringSoonEl = document.getElementById('expiring-soon');
    
    if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts;
    if (totalSalesEl) totalSalesEl.textContent = stats.todaySales;
    if (lowStockEl) lowStockEl.textContent = stats.lowStock;
    if (expiringSoonEl) expiringSoonEl.textContent = stats.expiringSoon;
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

// ================================================
// START APPLICATION
// ================================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

// ================================================
// GLOBAL FUNCTION EXPORTS
// ================================================

// Make functions available globally
window.login = login;
window.handleLoginForm = handleLoginForm;
window.fallbackLogin = fallbackLogin;
window.logout = function() {
    if (confirm('Keluar dari sistem?')) {
        localStorage.clear();
        window.location.reload();
    }
};

console.log('✅ Auth module loaded and ready!');
