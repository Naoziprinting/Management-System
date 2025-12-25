// File: js/auth.js - FIX CIRCULAR REFERENCE
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
            error: error.message || 'Network error'
        };
    }
}

// ================================================
// LOGIN FUNCTION - FIXED (NO handleLogin INSIDE)
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
            // FIX: Jangan panggil handleLogin di sini!
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

// ================================================
// HANDLE LOGIN FORM SUBMISSION - SEPARATE FUNCTION
// ================================================

async function handleLoginForm() {
    console.log('🎯 handleLoginForm() called');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        console.error('Email or password input not found');
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
    
    // Call the login function
    await login(email, password);
}

// ================================================
// UI FUNCTIONS
// ================================================

function switchToLogin() {
    console.log('🔄 Switching to login screen');
    
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) {
        loginScreen.classList.add('active');
    }
    
    if (dashboardScreen) {
        dashboardScreen.classList.remove('active');
    }
}

function switchToDashboard() {
    console.log('🔄 Switching to dashboard');
    
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) {
        loginScreen.classList.remove('active');
    }
    
    if (dashboardScreen) {
        dashboardScreen.classList.add('active');
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
    
    // Add spinner animation
    if (!document.querySelector('#spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
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
    
    // Add animations if not exists
    if (!document.querySelector('#notification-animations')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'notification-animations';
        styleEl.textContent = `
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
        document.head.appendChild(styleEl);
    }
}

// ================================================
// EVENT HANDLERS - FIXED
// ================================================

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Login button - Use handleLoginForm (not handleLogin)
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        console.log('✅ Found login button');
        // Remove existing listeners first
        loginBtn.replaceWith(loginBtn.cloneNode(true));
        const newLoginBtn = document.getElementById('login-btn');
        
        newLoginBtn.addEventListener('click', handleLoginForm);
        console.log('✅ Added click listener to login button');
    } else {
        console.error('❌ Login button not found!');
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
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            console.log('Navigating to page:', page);
            // Navigation logic will be implemented later
        });
    });
    
    // Test user buttons
    const testButtons = document.querySelectorAll('.btn-test-user');
    testButtons.forEach(button => {
        button.addEventListener('click', function() {
            const email = this.getAttribute('data-email');
            const password = this.getAttribute('data-password');
            
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
    
    console.log('✅ Event listeners setup complete');
}

// ================================================
// INITIALIZATION - FIXED
// ================================================

function initializeApp() {
    console.log('🚀 Initializing Youzi Corp Inventory System...');
    
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

function initializeDashboard() {
    console.log('📊 Initializing dashboard...');
    
    // Update user info
    updateUserInfo();
    
    // Load dashboard data
    updateDashboardStats();
    loadRecentActivity();
}

function updateDashboardStats() {
    // Placeholder - will be implemented with real data
    console.log('Updating dashboard stats...');
    
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
    console.log('Loading recent activity...');
    
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
window.YouziAuth = {
    login: login,
    handleLoginForm: handleLoginForm,
    logout: logout,
    testAPIConnection: testAPIConnection,
    switchToDashboard: switchToDashboard,
    switchToLogin: switchToLogin
};

// Alias for backward compatibility
window.login = login;
window.handleLogin = handleLoginForm; // Alias untuk handleLoginForm
window.logout = logout;

console.log('✅ Auth module loaded and functions exported to window');
