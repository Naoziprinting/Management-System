// Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbwOXpLlyyHLrLk-RxuldWdZYSghJkk71m9kDIEmG7jvcnpviQ--n1J_GLgphLiw-MhM/exec";

// Authentication State
let currentUser = null;
let authToken = localStorage.getItem('youzi_token');

// API Functions
async function apiRequest(action, data = {}, method = 'POST') {
    try {
        const payload = {
            ...data,
            action: action
        };

        const response = await fetch(API_URL, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: method === 'POST' ? JSON.stringify(payload) : null
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Request failed:', error);
        return {
            success: false,
            error: 'Koneksi gagal. Periksa internet Anda.'
        };
    }
}

// Login Function
async function login(email, password) {
    showLoading();
    
    const result = await apiRequest('login', { email, password });
    
    hideLoading();
    
    if (result.success) {
        // Save token and user data
        localStorage.setItem('youzi_token', result.token);
        localStorage.setItem('youzi_user', JSON.stringify(result.user));
        
        authToken = result.token;
        currentUser = result.user;
        
        // Switch to dashboard
        switchToDashboard();
        
        // Initialize dashboard data
        initializeDashboard();
        
        return { success: true };
    } else {
        return {
            success: false,
            error: result.error || 'Login gagal'
        };
    }
}

// Logout Function
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('youzi_token');
        localStorage.removeItem('youzi_user');
        authToken = null;
        currentUser = null;
        switchToLogin();
    }
}

// Check Authentication
function checkAuth() {
    if (authToken && currentUser) {
        return true;
    }
    
    // Try to restore from localStorage
    const storedUser = localStorage.getItem('youzi_user');
    const storedToken = localStorage.getItem('youzi_token');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        return true;
    }
    
    return false;
}

// Initialize App
function initializeApp() {
    // Check dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('dark-mode-switch').checked = true;
    }
    
    // Check if user is already logged in
    if (checkAuth()) {
        switchToDashboard();
        initializeDashboard();
    } else {
        switchToLogin();
    }
    
    // Setup event listeners
    setupEventListeners();
}

// Switch between screens
function switchToDashboard() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
    
    // Update user info in sidebar
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.full_name;
        document.getElementById('user-role').textContent = currentUser.role;
        
        // Update page title based on role
        const roleTitles = {
            'admin': 'Administrator',
            'manager': 'Manager',
            'gudang': 'Staff Gudang',
            'sales': 'Sales',
            'keuangan': 'Staff Keuangan'
        };
        
        document.getElementById('user-role').textContent = roleTitles[currentUser.role] || currentUser.role;
    }
}

function switchToLogin() {
    document.getElementById('dashboard-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    
    // Clear login form
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            switchPage(page);
        });
    });
    
    // Dark mode toggle
    document.getElementById('dark-mode-switch').addEventListener('change', function() {
        if (this.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
        }
    });
    
    // QR Scan button
    document.getElementById('quick-scan').addEventListener('click', openQRScanner);
    
    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
}

// Handle Login
async function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Email dan password harus diisi');
        return;
    }
    
    const result = await login(email, password);
    
    if (!result.success) {
        alert(result.error || 'Login gagal');
    }
}

// Switch Pages
function switchPage(page) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
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
    
    document.getElementById('page-title').textContent = pageTitles[page] || page;
    
    // Show selected page
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Load page content if needed
    if (page === 'products') {
        loadProductsPage();
    }
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const isCollapsed = sidebar.style.width === '70px' || sidebar.offsetWidth === 70;
    
    if (isCollapsed) {
        sidebar.style.width = 'var(--sidebar-width)';
    } else {
        sidebar.style.width = 'var(--sidebar-collapsed)';
    }
}

// QR Scanner
function openQRScanner() {
    const modal = document.getElementById('qr-scanner-modal');
    modal.classList.add('active');
    
    // Initialize QR Scanner
    const html5QrCode = new Html5Qrcode("qr-reader");
    
    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        (decodedText, decodedResult) => {
            // Handle successful scan
            handleQRScan(decodedText);
            html5QrCode.stop();
            modal.classList.remove('active');
        },
        (errorMessage) => {
            // Handle scan error
            console.log(`QR Code scan error: ${errorMessage}`);
        }
    );
    
    // Close modal
    modal.querySelector('.modal-close').onclick = () => {
        html5QrCode.stop();
        modal.classList.remove('active');
    };
}

function handleQRScan(qrData) {
    alert(`QR Code berhasil discan: ${qrData}`);
    // Implement your QR code handling logic here
}

// Loading States
function showLoading(message = 'Memuat...') {
    // Implement loading overlay
    console.log('Loading:', message);
}

function hideLoading() {
    // Hide loading overlay
    console.log('Loading complete');
}

// Initialize Dashboard Data
async function initializeDashboard() {
    // Load dashboard data from API
    updateDashboardStats();
    loadRecentActivity();
}

async function updateDashboardStats() {
    // Mock data for now - will be replaced with API calls
    document.getElementById('total-products').textContent = '156';
    document.getElementById('total-sales').textContent = 'Rp 12.450.000';
    document.getElementById('low-stock').textContent = '8';
    document.getElementById('expiring-soon').textContent = '15';
}

function loadRecentActivity() {
    const activityList = document.getElementById('recent-activity');
    
    // Mock activities
    const activities = [
        { icon: 'fa-box', text: 'Produk "Nasi Goreng" ditambahkan', time: '2 jam lalu' },
        { icon: 'fa-shopping-cart', text: 'Transaksi penjualan #TRX001', time: '4 jam lalu' },
        { icon: 'fa-exclamation-triangle', text: 'Stock "Mie Instan" rendah', time: '1 hari lalu' },
        { icon: 'fa-user', text: 'User baru "John Doe" didaftarkan', time: '2 hari lalu' }
    ];
    
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
