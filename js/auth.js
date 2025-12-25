// File: js/auth.js - SIMPLIFIED WORKING VERSION
console.log('🚀 auth.js loaded!');

// Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbwOXpLlyyHLrLk-RxuldWdZYSghJkk71m9kDIEmG7jvcnpviQ--n1J_GLgphLiw-MhM/exec";

// Global state
let currentUser = null;
let authToken = localStorage.getItem('youzi_token');

// ================================================
// SIMPLE API FUNCTION
// ================================================

async function apiRequest(action, data = {}) {
    console.log(`📡 API Request: ${action}`, data);
    
    try {
        // Use GET for all requests to avoid CORS issues
        const params = new URLSearchParams();
        params.append('action', action);
        
        Object.keys(data).forEach(key => {
            params.append(key, data[key]);
        });
        
        const url = `${API_URL}?${params.toString()}`;
        console.log('Request URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        try {
            return JSON.parse(text);
        } catch (error) {
            console.error('JSON parse error:', error);
            return {
                success: false,
                error: 'Invalid JSON response',
                raw: text
            };
        }
        
    } catch (error) {
        console.error('API Request failed:', error);
        return {
            success: false,
            error: 'Network error: ' + error.message
        };
    }
}

// ================================================
// SIMPLE LOGIN FUNCTION
// ================================================

async function login(email, password) {
    console.log('🔐 Login attempt:', email);
    
    // Show loading
    showLoading('Memproses login...');
    
    try {
        const result = await apiRequest('login', { email, password });
        console.log('Login result:', result);
        
        if (result && result.success) {
            // Save data
            authToken = result.token;
            currentUser = result.user;
            
            localStorage.setItem('youzi_token', authToken);
            localStorage.setItem('youzi_user', JSON.stringify(currentUser));
            
            // Switch to dashboard
            switchToDashboard();
            
            // Show success
            showNotification(`Selamat datang, ${currentUser.full_name}!`, 'success');
            
            return { success: true };
        } else {
            const errorMsg = result?.error || 'Login gagal';
            showNotification(errorMsg, 'error');
            return { success: false, error: errorMsg };
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Terjadi kesalahan', 'error');
        return { success: false, error: error.message };
    } finally {
        hideLoading();
    }
}

// ================================================
// UI FUNCTIONS
// ================================================

function switchToLogin() {
    console.log('Switching to login screen');
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) loginScreen.classList.add('active');
    if (dashboardScreen) dashboardScreen.classList.remove('active');
}

function switchToDashboard() {
    console.log('Switching to dashboard');
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (loginScreen) loginScreen.classList.remove('active');
    if (dashboardScreen) dashboardScreen.classList.add('active');
    
    // Update user info
    updateUserInfo();
}

function updateUserInfo() {
    if (!currentUser) return;
    
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    
    if (userNameEl) userNameEl.textContent = currentUser.full_name;
    if (userRoleEl) userRoleEl.textContent = currentUser.role.toUpperCase();
}

function showLoading(message) {
    console.log('Loading:', message);
    // Simple loading indicator
    const existing = document.getElementById('simple-loading');
    if (existing) existing.remove();
    
    const loading = document.createElement('div');
    loading.id = 'simple-loading';
    loading.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 18px;
            flex-direction: column;
        ">
            <div class="spinner" style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin-bottom: 15px;
            "></div>
            <div>${message}</div>
        </div>
    `;
    
    document.body.appendChild(loading);
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

function hideLoading() {
    const loading = document.getElementById('simple-loading');
    if (loading) loading.remove();
}

function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]:`, message);
    
    // Remove existing
    document.querySelectorAll('.simple-notification').forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `simple-notification`;
    
    const colors = {
        'success': '#2ecc71',
        'error': '#e74c3c',
        'warning': '#f39c12',
        'info': '#3498db'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-family: 'Inter', sans-serif;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Add animations
    const style = document.createElement('style');
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

// ================================================
// EVENT HANDLERS
// ================================================

function handleLogin() {
    console.log('handleLogin() called!');
    
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    
    console.log('Form values:', { email, password });
    
    if (!email || !password) {
        showNotification('Email dan password harus diisi', 'warning');
        return;
    }
    
    login(email, password);
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        console.log('Found login button, adding click listener');
        loginBtn.addEventListener('click', handleLogin);
    } else {
        console.error('Login button NOT FOUND!');
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Keluar dari sistem?')) {
                localStorage.clear();
                window.location.reload();
            }
        });
    }
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            console.log('Navigating to:', page);
        });
    });
    
    // Test user buttons
    document.querySelectorAll('.btn-test-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const email = this.dataset.email;
            const password = this.dataset.password;
            
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
            
            console.log('Auto-filled test user:', email);
        });
    });
}

// ================================================
// INITIALIZATION
// ================================================

function initializeApp() {
    console.log('🚀 Initializing app...');
    
    // Check if user is already logged in
    const storedToken = localStorage.getItem('youzi_token');
    const storedUser = localStorage.getItem('youzi_user');
    
    if (storedToken && storedUser) {
        try {
            authToken = storedToken;
            currentUser = JSON.parse(storedUser);
            console.log('User found:', currentUser);
            switchToDashboard();
        } catch (error) {
            console.error('Error restoring user:', error);
            switchToLogin();
        }
    } else {
        console.log('No stored user, showing login');
        switchToLogin();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Test API connection
    testAPIConnection();
}

async function testAPIConnection() {
    console.log('Testing API connection...');
    try {
        const result = await apiRequest('test');
        console.log('API test result:', result);
        
        if (result && result.success) {
            showNotification('API terhubung', 'success');
        } else {
            showNotification('API tidak merespon', 'warning');
        }
    } catch (error) {
        console.error('API test failed:', error);
    }
}

// ================================================
// START APP
// ================================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM fully loaded');
    initializeApp();
});

// Make functions available globally
window.login = login;
window.handleLogin = handleLogin;
window.testAPIConnection = testAPIConnection;
