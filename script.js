// ===== Authentication State =====
let isLoggedIn = false;
let currentUser = null;
let isAdminLoggedIn = false;

// Default Admin Credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Load user data from localStorage
function loadUserData() {
    const userData = localStorage.getItem('goldVaultUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        isLoggedIn = true;
    }
}

// Load Admin Settings
function loadAdminSettings() {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
        return JSON.parse(savedSettings);
    }
    return getDefaultAdminSettings();
}

function getDefaultAdminSettings() {
    return {
        adminPassword: 'admin123',
        siteName: 'GoldVault',
        description: 'Digital Gold Investment Platform',
        minInvestment: 1,
        starterFee: 1.5,
        professionalFee: 0.75,
        premiumFee: 0.25,
        contactEmail: 'support@goldvault.com',
        maintenanceMode: false,
        theme: {
            primaryColor: '#ffd700',
            accentColor: '#ff9500',
            darkBg: '#0a0a0a',
            cardBg: '#1a1a1a',
            textColor: '#ffffff'
        }
    };
}

// ===== Authentication Modal Functions =====
function openAuthModal(type) {
    const modal = document.getElementById('authModal');
    modal.classList.add('show');

    if (type === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else if (type === 'signup') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
}

function switchAuthForm(type) {
    if (type === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else if (type === 'signup') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate inputs
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Check if this is an admin login
    const adminSettings = loadAdminSettings();
    console.log('Login attempt - Email:', email, 'Password entered:', password, 'Admin password:', adminSettings.adminPassword);

    if (email === 'admin' && password === adminSettings.adminPassword) {
        console.log('Admin login successful');
        isAdminLoggedIn = true;
        closeAuthModal();
        setTimeout(() => {
            openAdminDashboard();
        }, 300);
        showNotification('Welcome Admin!', 'success');
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        updateProfileIcon();
        return;
    }

    // Regular user login
    const storedUser = localStorage.getItem('goldVaultUser_' + email);

    if (!storedUser) {
        showNotification('User not found. Please sign up first.', 'error');
        return;
    }

    const userData = JSON.parse(storedUser);

    if (userData.password !== password) {
        showNotification('Invalid password', 'error');
        return;
    }

    // Check if user account is active
    if (userData.status === 'inactive' || userData.status === 'suspended') {
        showNotification('Your account has been ' + (userData.status === 'suspended' ? 'suspended' : 'deactivated') + '. Please contact support for assistance.', 'error');
        return;
    }

    // Set user as logged in
    currentUser = userData;
    isLoggedIn = true;

    if (rememberMe) {
        localStorage.setItem('goldVaultUser', JSON.stringify(userData));
    }

    showNotification('Successfully logged in!', 'success');
    closeAuthModal();
    openDashboard();
    updateProfileIcon(); // Update UI to show profile icon
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('rememberMe').checked = false;
}

// Handle Signup
function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirm').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    if (!agreeTerms) {
        showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
        return;
    }

    // Check if user already exists
    if (localStorage.getItem('goldVaultUser_' + email)) {
        showNotification('User already exists. Please login.', 'error');
        return;
    }

    // Create new user
    const startingBalance = 50000; // INR
    const signupBonus = startingBalance * 2; // 200% bonus
    const totalBalance = startingBalance + signupBonus;

    const userData = {
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString(),
        portfolio: {
            value: 0,
            goldHoldings: 0,
            balance: totalBalance // Starting balance + 200% signup bonus
        },
        signupBonusReceived: true // Mark that bonus was given
    };

    // Store user data
    localStorage.setItem('goldVaultUser_' + email, JSON.stringify(userData));
    localStorage.setItem('goldVaultUser', JSON.stringify(userData));

    currentUser = userData;
    isLoggedIn = true;

    showNotification('Account created successfully!', 'success');
    closeAuthModal();
    openDashboard();
    updateProfileIcon(); // Update UI to show profile icon

    // Clear form
    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupConfirm').value = '';
    document.getElementById('agreeTerms').checked = false;
}

// Handle Logout
function handleLogout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('goldVaultUser');
    closeDashboard();
    showNotification('You have been logged out', 'success');
    updateProfileIcon();
}

// ===== Dashboard Functions =====
function openDashboard() {
    if (!isLoggedIn || !currentUser) {
        alert('Please login first');
        return;
    }

    const dashboardModal = document.getElementById('dashboardModal');
    dashboardModal.classList.add('show');

    // Update dashboard with user data
    updateSimplePortfolio();
}

function closeDashboard() {
    document.getElementById('dashboardModal').classList.remove('show');
}

// Update simple portfolio data
function updateSimplePortfolio() {
    if (!currentUser || !currentUser.portfolio) {
        // Initialize default portfolio if not exists
        if (!currentUser.portfolio) {
            currentUser.portfolio = {
                balance: 50000,
                goldHoldingsGrams: 0
            };
        }
    }

    const balance = currentUser.portfolio.balance || 0;
    const goldGrams = currentUser.portfolio.goldHoldingsGrams || 0;
    const goldPrice = GOLD_PRICE_PER_GRAM;
    const portfolioValue = goldGrams * goldPrice;

    // Update balance
    document.getElementById('accountBalance').textContent = '₹' + balance.toLocaleString('en-IN', {maximumFractionDigits: 0});

    // Update gold holdings
    document.getElementById('totalGoldHeld').textContent = goldGrams.toFixed(2) + ' g';

    // Update portfolio value
    document.getElementById('portfolioValue').textContent = '₹' + portfolioValue.toLocaleString('en-IN', {maximumFractionDigits: 0});
}

// ===== Investment Functions =====

// Gold pricing data (in INR)
const GOLD_PRICE_PER_GRAM = 6150; // Indian Rupees per gram
const COMMISSION_RATE = 0.01; // 1% commission

// Update dashboard data
function updateDashboardData() {
    // Get current gold price
    const goldPrice = GOLD_PRICE_PER_GRAM;
    const goldPriceUSD = (goldPrice / 82).toFixed(2); // Convert to USD (approximate)
    
    // Initialize user portfolio if not exists
    if (!currentUser.portfolio) {
        currentUser.portfolio = {
            goldHoldings: 0,
            balance: 50000,
            goldHoldingsGrams: 0
        };
    }

    // Update price displays
    document.getElementById('pricePerGram').textContent = '₹' + goldPrice.toLocaleString('en-IN');
    document.getElementById('pricePerOunce').textContent = '$' + goldPriceUSD;

    // Update portfolio info
    const totalGoldGrams = currentUser.portfolio.goldHoldingsGrams || 0;
    const portfolioValue = totalGoldGrams * goldPrice;
    const accountBalance = currentUser.portfolio.balance || 50000;

    document.getElementById('totalGoldHeld').textContent = totalGoldGrams.toFixed(2) + ' g';
    document.getElementById('portfolioValue').textContent = '₹' + portfolioValue.toLocaleString('en-IN', {maximumFractionDigits: 0});
    document.getElementById('accountBalance').textContent = '₹' + accountBalance.toLocaleString('en-IN', {maximumFractionDigits: 0});

    // Update market info (simulated)
    const dayHigh = goldPrice + 100;
    const dayLow = goldPrice - 100;
    const dayChange = 150;

    document.getElementById('dayHigh').textContent = '₹' + dayHigh.toLocaleString('en-IN');
    document.getElementById('dayLow').textContent = '₹' + dayLow.toLocaleString('en-IN');
    document.getElementById('dayChange').textContent = '+₹' + dayChange + ' (+2.5%)';

    // Update last updated time
    const now = new Date();
    document.getElementById('lastUpdate').textContent = 'Updated ' + now.toLocaleTimeString();
}

// Setup investment calculator
function setupInvestmentCalculator() {
    const investmentInput = document.getElementById('investmentAmount');

    if (investmentInput) {
        investmentInput.addEventListener('input', calculateInvestmentPreview);
        investmentInput.addEventListener('change', calculateInvestmentPreview);
    }

    // Calculate initially
    calculateInvestmentPreview();
}

// Calculate investment preview
function calculateInvestmentPreview() {
    const amountInput = document.getElementById('investmentAmount');
    const amount = parseFloat(amountInput.value) || 0;

    // Validate amount
    if (amount < 10) {
        document.getElementById('previewAmount').textContent = '₹0';
        document.getElementById('previewGold').textContent = '0.00 g';
        document.getElementById('previewCommission').textContent = '₹0';
        document.getElementById('previewTotal').textContent = '₹0';
        return;
    }

    if (amount > 50000) {
        amountInput.value = 50000;
        calculateInvestmentPreview();
        return;
    }

    const goldPrice = GOLD_PRICE_PER_GRAM;
    const commission = amount * COMMISSION_RATE;
    const investmentAfterCommission = amount + commission;
    const goldGrams = amount / goldPrice;

    // Update preview
    document.getElementById('previewAmount').textContent = '₹' + amount.toLocaleString('en-IN');
    document.getElementById('previewPrice').textContent = '₹' + goldPrice.toLocaleString('en-IN');
    document.getElementById('previewGold').textContent = goldGrams.toFixed(4) + ' g';
    document.getElementById('previewCommission').textContent = '₹' + commission.toFixed(2);
    document.getElementById('previewTotal').textContent = '₹' + investmentAfterCommission.toFixed(2);
}

// Handle investment
function handleInvestment(event) {
    event.preventDefault();

    if (!isLoggedIn || !currentUser) {
        alert('Please login first');
        return;
    }

    const amountInput = document.getElementById('investmentAmount');
    const amount = parseFloat(amountInput.value);

    // Validate
    if (!amount || amount < 10 || amount > 50000) {
        alert('Please enter a valid amount between ₹10 and ₹50,000');
        return;
    }

    // Initialize portfolio if not exists
    if (!currentUser.portfolio) {
        currentUser.portfolio = {
            goldHoldings: 0,
            balance: 50000,
            goldHoldingsGrams: 0
        };
    }

    const goldPrice = GOLD_PRICE_PER_GRAM;
    const commission = amount * COMMISSION_RATE;
    const totalCost = amount + commission;
    const goldGrams = amount / goldPrice;

    // Check balance
    if (totalCost > currentUser.portfolio.balance) {
        alert('Insufficient balance. You need ₹' + totalCost.toFixed(2) + ' but have ₹' + currentUser.portfolio.balance.toFixed(2));
        return;
    }

    // Process investment
    currentUser.portfolio.balance -= totalCost;
    currentUser.portfolio.goldHoldingsGrams = (currentUser.portfolio.goldHoldingsGrams || 0) + goldGrams;
    currentUser.portfolio.goldHoldings = currentUser.portfolio.goldHoldings || 0;

    // Save transaction
    saveInvestmentTransaction('buy', goldGrams, goldPrice, amount);

    // Update localStorage
    localStorage.setItem('goldVaultUser_' + currentUser.email, JSON.stringify(currentUser));
    localStorage.setItem('goldVaultUser', JSON.stringify(currentUser));

    // Update dashboard
    updateDashboardData();
    loadUserTransactions();
    amountInput.value = '';
    calculateInvestmentPreview();

    // Show success message
    showNotification(`Successfully invested ₹${amount}! You now own ${goldGrams.toFixed(4)}g of gold.`, 'success');
}

// Save investment transaction
function saveInvestmentTransaction(type, amount, price, totalAmount) {
    if (!currentUser) return;

    const transactions = JSON.parse(localStorage.getItem('userTransactions_' + currentUser.email) || '[]');

    transactions.push({
        date: new Date().toISOString(),
        type: type,
        amount: amount,
        price: price,
        totalAmount: totalAmount,
        goldGrams: amount
    });

    localStorage.setItem('userTransactions_' + currentUser.email, JSON.stringify(transactions));
}

// Load user transactions
function loadUserTransactions() {
    if (!currentUser) return;

    const transactions = JSON.parse(localStorage.getItem('userTransactions_' + currentUser.email) || '[]');
    const transactionsList = document.getElementById('transactionsList');

    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No transactions yet. Start investing!</p>';
        return;
    }

    // Show last 5 transactions
    let html = '';
    transactions.slice().reverse().slice(0, 5).forEach(tx => {
        const date = new Date(tx.date);
        const dateStr = date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
        const badge = tx.type === 'buy' ? '<span class="transaction-badge">💰 Purchased</span>' : '<span class="transaction-badge sell">💸 Sold</span>';
        
        html += `
            <div class="transaction-item ${tx.type === 'sell' ? 'sell' : ''}">
                <div class="transaction-info">
                    <div class="transaction-date">${dateStr}</div>
                    <div class="transaction-amount">${tx.goldGrams.toFixed(4)} g of gold @ ₹${tx.price.toLocaleString('en-IN')}/g</div>
                </div>
                ${badge}
            </div>
        `;
    });

    transactionsList.innerHTML = html;
}

// ===== Admin Functions =====

// Close Admin Login Modal
function closeAdminLogin() {
    document.getElementById('adminLoginModal').classList.remove('show');
}

// Close Admin Dashboard
function closeAdminDashboard() {
    document.getElementById('adminDashboardModal').classList.remove('show');
}

// Open Admin Dashboard
function openAdminDashboard() {
    if (!isAdminLoggedIn) {
        showNotification('Please login as admin', 'error');
        return;
    }

    const dashboardModal = document.getElementById('adminDashboardModal');
    dashboardModal.classList.add('show');

    // Load admin data
    loadAdminOverview();
    loadThemeSettings();
    loadUsersList();
    loadTransactionsList();
    loadSiteSettings();
}

// Handle Admin Logout
function handleAdminLogout() {
    isAdminLoggedIn = false;
    closeAdminDashboard();
    showNotification('Admin logged out', 'success');
}

// Switch Admin Tabs
function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById('tab-' + tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    event.target.classList.add('active');

    // Refresh data based on tab
    if (tabName === 'overview') {
        loadAdminOverview();
    } else if (tabName === 'users') {
        loadUsersList();
    } else if (tabName === 'transactions') {
        loadTransactionsList();
    }
}

// ===== Admin Overview =====
function loadAdminOverview() {
    // Count total users
    let totalUsers = 0;
    let totalTransactions = 0;
    let totalVolume = 0;

    // Iterate through all users
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('goldVaultUser_')) {
            totalUsers++;
        }
        if (key.startsWith('goldVaultActivities_')) {
            const activities = JSON.parse(localStorage.getItem(key) || '[]');
            totalTransactions += activities.length;
            activities.forEach(activity => {
                totalVolume += activity.total || 0;
            });
        }
    }

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalTransactions').textContent = totalTransactions;
    document.getElementById('totalVolume').textContent = '₹' + (totalVolume * 83).toLocaleString('en-IN');
    document.getElementById('activeSessions').textContent = (isLoggedIn ? 1 : 0);

    // Load activity log
    loadActivityLog();
}

function loadActivityLog() {
    const tbody = document.getElementById('activityLogBody');
    const activities = [];

    // Collect all activities
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('goldVaultActivities_')) {
            const userActivities = JSON.parse(localStorage.getItem(key) || '[]');
            userActivities.forEach(activity => {
                activities.push({
                    ...activity,
                    user: key.replace('goldVaultActivities_', '')
                });
            });
        }
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display recent activities (limit to 10)
    tbody.innerHTML = '';
    activities.slice(0, 10).forEach(activity => {
        const row = `
            <tr>
                <td>${formatDate(activity.date)}</td>
                <td>${activity.user}</td>
                <td>${activity.action.toUpperCase()}</td>
                <td>${activity.amount ? activity.amount.toFixed(6) + ' oz @ $' + activity.price.toFixed(2) : 'N/A'}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-light);">No activity yet</td></tr>';
    }
}

// ===== Theme Management =====
function loadThemeSettings() {
    const settings = loadAdminSettings();
    const theme = settings.theme;

    document.getElementById('primaryColor').value = theme.primaryColor;
    document.getElementById('primaryColorHex').value = theme.primaryColor;
    document.getElementById('accentColor').value = theme.accentColor;
    document.getElementById('accentColorHex').value = theme.accentColor;
    document.getElementById('darkBg').value = theme.darkBg;
    document.getElementById('darkBgHex').value = theme.darkBg;
    document.getElementById('cardBg').value = theme.cardBg;
    document.getElementById('cardBgHex').value = theme.cardBg;
    document.getElementById('textColor').value = theme.textColor;
    document.getElementById('textColorHex').value = theme.textColor;

    updateThemePreview(theme);
}

function updateThemePreview(theme) {
    const preview = document.getElementById('themePreview');
    preview.innerHTML = `
        <div class="preview-item" style="background-color: ${theme.primaryColor}; color: ${theme.darkBg};">
            Primary Color
        </div>
        <div class="preview-item" style="background-color: ${theme.accentColor}; color: white;">
            Accent Color
        </div>
        <div class="preview-item" style="background-color: ${theme.darkBg}; color: ${theme.textColor}; border: 1px solid rgba(255,215,0,0.2);">
            Dark Background
        </div>
        <div class="preview-item" style="background-color: ${theme.cardBg}; color: ${theme.textColor}; border: 1px solid rgba(255,215,0,0.2);">
            Card Background
        </div>
    `;
}

// Update hex input when color picker changes
document.addEventListener('DOMContentLoaded', function() {
    const colorInputs = [
        ['primaryColor', 'primaryColorHex'],
        ['accentColor', 'accentColorHex'],
        ['darkBg', 'darkBgHex'],
        ['cardBg', 'cardBgHex'],
        ['textColor', 'textColorHex']
    ];

    colorInputs.forEach(([colorId, hexId]) => {
        const colorInput = document.getElementById(colorId);
        const hexInput = document.getElementById(hexId);
        
        if (colorInput) {
            colorInput.addEventListener('input', function() {
                if (hexInput) hexInput.value = this.value;
            });
        }
        if (hexInput) {
            hexInput.addEventListener('input', function() {
                if (colorInput && /^#[0-9A-F]{6}$/i.test(this.value)) {
                    colorInput.value = this.value;
                }
            });
        }
    });
});

function applyTheme() {
    const theme = {
        primaryColor: document.getElementById('primaryColor').value,
        accentColor: document.getElementById('accentColor').value,
        darkBg: document.getElementById('darkBg').value,
        cardBg: document.getElementById('cardBg').value,
        textColor: document.getElementById('textColor').value
    };

    // Save theme
    const settings = loadAdminSettings();
    settings.theme = theme;
    localStorage.setItem('adminSettings', JSON.stringify(settings));

    // Apply theme to document
    applyThemeToDOM(theme);

    showNotification('Theme applied successfully!', 'success');
}

function applyThemeToDOM(theme) {
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
    document.documentElement.style.setProperty('--dark-bg', theme.darkBg);
    document.documentElement.style.setProperty('--card-bg', theme.cardBg);
    document.documentElement.style.setProperty('--text-color', theme.textColor);
}

function resetTheme() {
    const defaultSettings = getDefaultAdminSettings();
    const settings = loadAdminSettings();
    settings.theme = defaultSettings.theme;
    localStorage.setItem('adminSettings', JSON.stringify(settings));

    loadThemeSettings();
    applyThemeToDOM(defaultSettings.theme);

    showNotification('Theme reset to default!', 'success');
}

function exportTheme() {
    const settings = loadAdminSettings();
    const themeData = JSON.stringify(settings.theme, null, 2);
    
    const blob = new Blob([themeData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `goldvault_theme_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Theme exported successfully!', 'success');
}

// ===== User Management =====
function loadUsersList() {
    const tbody = document.getElementById('usersTableBody');
    const users = [];

    // Collect all users
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('goldVaultUser_')) {
            const user = JSON.parse(localStorage.getItem(key) || '{}');
            users.push(user);
        }
    }

    // Apply filters
    const filteredUsers = filterUsersList(users);

    tbody.innerHTML = '';
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-light);">No users match the current filters</td></tr>';
        return;
    }

    filteredUsers.forEach(user => {
        const portfolio = user.portfolio || {};
        const portfolioValue = ((portfolio.goldHoldingsGrams || 0) * GOLD_PRICE_PER_GRAM) + (portfolio.balance || 0); // Keep in INR
        const statusBadge = getStatusBadge(user.status || 'active');
        const roleBadge = getRoleBadge(user.role || 'user');
        const lastLogin = user.lastLogin ? formatDate(user.lastLogin) : 'Never';

        const row = `
            <tr>
                <td><input type="checkbox" class="user-checkbox" value="${user.email}" onchange="updateBulkActions()"></td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>₹${portfolioValue.toLocaleString('en-IN')}</td>
                <td>${(portfolio.goldHoldingsGrams || 0).toFixed(3)}g</td>
                <td>${lastLogin}</td>
                <td>${statusBadge}</td>
                <td>${roleBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn small" onclick="editUser('${user.email}')">✏️</button>
                        <button class="action-btn small" onclick="viewUserDetails('${user.email}')">👁️</button>
                        <button class="action-btn small danger" onclick="deleteUser('${user.email}')">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    updateUserStats(filteredUsers);
}

function filterUsersList(users) {
    const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
    const statusFilter = document.getElementById('userStatusFilter').value;

    return users.filter(user => {
        // Search filter
        const matchesSearch = !searchTerm ||
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);

        // Status filter
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && (!user.status || user.status === 'active')) ||
            (statusFilter === 'inactive' && user.status === 'inactive');

        return matchesSearch && matchesStatus;
    });
}

function getStatusBadge(status) {
    const statusConfig = {
        'active': { text: 'Active', class: 'success' },
        'inactive': { text: 'Inactive', class: 'warning' },
        'suspended': { text: 'Suspended', class: 'danger' }
    };

    const config = statusConfig[status] || statusConfig['active'];
    return `<span class="status-badge ${config.class}">${config.text}</span>`;
}

function getRoleBadge(role) {
    const roleConfig = {
        'user': { text: 'User', class: 'info' },
        'premium': { text: 'Premium', class: 'success' },
        'admin': { text: 'Admin', class: 'danger' }
    };

    const config = roleConfig[role] || roleConfig['user'];
    return `<span class="role-badge ${config.class}">${config.text}</span>`;
}

function updateUserStats(users) {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => !u.status || u.status === 'active').length;
    const premiumUsers = users.filter(u => u.role === 'premium').length;
    const totalBalance = users.reduce((sum, u) => sum + ((u.portfolio?.balance || 0) / 82), 0); // Convert to USD
    const totalGold = users.reduce((sum, u) => sum + (u.portfolio?.goldHoldingsGrams || 0), 0);

    // Update stats display if elements exist
    const statsElements = {
        'totalUsers': totalUsers,
        'activeUsers': activeUsers,
        'premiumUsers': premiumUsers,
        'totalBalance': `$${totalBalance.toFixed(2)}`,
        'totalGold': `${totalGold.toFixed(2)}g`
    };

    Object.entries(statsElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function updateBulkActions() {
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    const bulkActions = document.getElementById('bulkActions');

    if (bulkActions) {
        bulkActions.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
    }
}

function viewUserDetails(email) {
    const user = JSON.parse(localStorage.getItem('goldVaultUser_' + email));
    if (!user) return;

    // Create details modal
    const detailsModal = document.createElement('div');
    detailsModal.className = 'modal';
    detailsModal.id = 'userDetailsModal';
    detailsModal.innerHTML = `
        <div class="modal-content admin-modal-content">
            <span class="close" onclick="closeUserDetailsModal()">&times;</span>
            <h2>User Details: ${user.name}</h2>
            <div class="user-details-grid">
                <div class="detail-section">
                    <h3>Basic Information</h3>
                    <div class="detail-item">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${user.name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${user.email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Username:</span>
                        <span class="detail-value">${user.username || 'Not set'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Joined:</span>
                        <span class="detail-value">${formatDate(user.createdAt)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Last Login:</span>
                        <span class="detail-value">${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">${getStatusBadge(user.status || 'active')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Role:</span>
                        <span class="detail-value">${getRoleBadge(user.role || 'user')}</span>
                    </div>
                </div>
                <div class="detail-section">
                    <h3>Portfolio Information</h3>
                    <div class="detail-item">
                        <span class="detail-label">Account Balance:</span>
                        <span class="detail-value">₹${(user.portfolio?.balance || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Gold Holdings:</span>
                        <span class="detail-value">${(user.portfolio?.goldHoldingsGrams || 0).toFixed(4)}g</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Gold Value:</span>
                        <span class="detail-value">₹${((user.portfolio?.goldHoldingsGrams || 0) * GOLD_PRICE_PER_GRAM).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Total Portfolio:</span>
                        <span class="detail-value">₹${((user.portfolio?.balance || 0) + ((user.portfolio?.goldHoldingsGrams || 0) * GOLD_PRICE_PER_GRAM)).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn-primary" onclick="editUser('${email}')">Edit User</button>
                <button class="btn-secondary" onclick="resetUserPassword('${email}')">Reset Password</button>
                <button class="btn-danger" onclick="deleteUser('${email}')">Delete User</button>
            </div>
        </div>
    `;

    document.body.appendChild(detailsModal);
    detailsModal.classList.add('show');
}

function closeUserDetailsModal() {
    const modal = document.getElementById('userDetailsModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function logAdminAction(action, details) {
    const adminLog = JSON.parse(localStorage.getItem('adminActivityLog') || '[]');
    adminLog.push({
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        admin: 'admin'
    });

    // Keep only last 100 entries
    if (adminLog.length > 100) {
        adminLog.splice(0, adminLog.length - 100);
    }

    localStorage.setItem('adminActivityLog', JSON.stringify(adminLog));
}

function refreshUsersList() {
    loadUsersList();
    showNotification('User list refreshed!', 'success');
}

function editUser(email) {
    const user = JSON.parse(localStorage.getItem('goldVaultUser_' + email));
    if (!user) return;

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editUserModal';
    editModal.innerHTML = `
        <div class="modal-content admin-modal-content">
            <span class="close" onclick="closeEditUserModal()">&times;</span>
            <h2>Edit User: ${user.name}</h2>
            <form id="editUserForm" onsubmit="saveUserChanges(event, '${email}')">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editUserName">Full Name</label>
                        <input type="text" id="editUserName" value="${user.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editUserEmail">Email</label>
                        <input type="email" id="editUserEmail" value="${user.email || ''}" readonly>
                        <small>Email cannot be changed</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editUserBalance">Account Balance (₹)</label>
                        <input type="number" id="editUserBalance" value="${user.portfolio?.balance || 0}" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label for="editUserGold">Gold Holdings (g)</label>
                        <input type="number" id="editUserGold" value="${user.portfolio?.goldHoldingsGrams || 0}" step="0.001" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editUserStatus">Account Status</label>
                        <select id="editUserStatus">
                            <option value="active" ${user.status !== 'inactive' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editUserRole">User Role</label>
                        <select id="editUserRole">
                            <option value="user" ${user.role !== 'premium' ? 'selected' : ''}>Regular User</option>
                            <option value="premium" ${user.role === 'premium' ? 'selected' : ''}>Premium User</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="editUserNotes">Admin Notes</label>
                    <textarea id="editUserNotes" rows="3" placeholder="Internal notes about this user">${user.adminNotes || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Save Changes</button>
                    <button type="button" class="btn-secondary" onclick="closeEditUserModal()">Cancel</button>
                    <button type="button" class="btn-danger" onclick="resetUserPassword('${email}')">Reset Password</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(editModal);
    editModal.classList.add('show');
}

function saveUserChanges(event, email) {
    event.preventDefault();

    const user = JSON.parse(localStorage.getItem('goldVaultUser_' + email));
    if (!user) return;

    // Update user data
    user.name = document.getElementById('editUserName').value.trim();
    user.portfolio = user.portfolio || {};
    user.portfolio.balance = parseFloat(document.getElementById('editUserBalance').value) || 0;
    user.portfolio.goldHoldingsGrams = parseFloat(document.getElementById('editUserGold').value) || 0;
    user.status = document.getElementById('editUserStatus').value;
    user.role = document.getElementById('editUserRole').value;
    user.adminNotes = document.getElementById('editUserNotes').value.trim();
    user.lastModified = new Date().toISOString();
    user.modifiedBy = 'admin';

    // Save updated user data
    localStorage.setItem('goldVaultUser_' + email, JSON.stringify(user));

    // Log admin action
    logAdminAction('user_updated', `Updated user ${email}: ${user.name}`);

    closeEditUserModal();
    loadUsersList();
    showNotification('User updated successfully!', 'success');
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function resetUserPassword(email) {
    if (confirm('Are you sure you want to reset this user\'s password? They will need to use "password123" to login.')) {
        const user = JSON.parse(localStorage.getItem('goldVaultUser_' + email));
        if (user) {
            user.password = 'password123'; // Temporary password
            user.passwordResetRequired = true;
            localStorage.setItem('goldVaultUser_' + email, JSON.stringify(user));

            logAdminAction('password_reset', `Reset password for user ${email}`);
            showNotification('Password reset to "password123". User will be prompted to change it.', 'success');
        }
    }
}

function deleteUser(email) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        localStorage.removeItem('goldVaultUser_' + email);
        localStorage.removeItem('goldVaultActivities_' + email);
        loadUsersList();
        loadAdminOverview();
        showNotification('User deleted successfully!', 'success');
    }
}

// ===== Transaction Management =====
function loadTransactionsList() {
    const tbody = document.getElementById('transactionsTableBody');
    const transactions = [];

    // Collect all transactions
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('goldVaultActivities_')) {
            const userTransactions = JSON.parse(localStorage.getItem(key) || '[]');
            const email = key.replace('goldVaultActivities_', '');
            
            userTransactions.forEach(transaction => {
                transactions.push({
                    ...transaction,
                    userEmail: email
                });
            });
        }
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = '';
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-light);">No transactions yet</td></tr>';
        return;
    }

    transactions.forEach(tx => {
        const row = `
            <tr>
                <td>${formatDate(tx.date)}</td>
                <td>${tx.userEmail}</td>
                <td><span class="action-${tx.action.toLowerCase()}">${tx.action.toUpperCase()}</span></td>
                <td>${tx.amount.toFixed(6)}</td>
                <td>$${tx.price.toFixed(2)}</td>
                <td>$${tx.total.toFixed(2)}</td>
                <td><span style="color: var(--success-color);">✓ Completed</span></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterTransactions() {
    const filterType = document.getElementById('transactionFilter').value;
    const filterDate = document.getElementById('transactionDate').value;

    const tbody = document.getElementById('transactionsTableBody');
    const transactions = [];

    // Collect all transactions
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('goldVaultActivities_')) {
            const userTransactions = JSON.parse(localStorage.getItem(key) || '[]');
            const email = key.replace('goldVaultActivities_', '');
            
            userTransactions.forEach(transaction => {
                // Apply filters
                let matches = true;

                if (filterType !== 'all' && transaction.action.toLowerCase() !== filterType) {
                    matches = false;
                }

                if (filterDate && formatDate(transaction.date) !== formatDate(new Date(filterDate))) {
                    matches = false;
                }

                if (matches) {
                    transactions.push({
                        ...transaction,
                        userEmail: email
                    });
                }
            });
        }
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = '';
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-light);">No transactions match filters</td></tr>';
        return;
    }

    transactions.forEach(tx => {
        const row = `
            <tr>
                <td>${formatDate(tx.date)}</td>
                <td>${tx.userEmail}</td>
                <td><span class="action-${tx.action.toLowerCase()}">${tx.action.toUpperCase()}</span></td>
                <td>${tx.amount.toFixed(6)}</td>
                <td>$${tx.price.toFixed(2)}</td>
                <td>$${tx.total.toFixed(2)}</td>
                <td><span style="color: var(--success-color);">✓ Completed</span></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    showNotification('Transactions filtered!', 'success');
}

// ===== Site Settings =====
function loadSiteSettings() {
    const settings = loadAdminSettings();

    document.getElementById('siteName').value = settings.siteName;
    document.getElementById('siteDescription').value = settings.description;
    document.getElementById('minInvestment').value = settings.minInvestment;
    document.getElementById('starterFee').value = settings.starterFee;
    document.getElementById('professionalFee').value = settings.professionalFee;
    document.getElementById('premiumFee').value = settings.premiumFee;
    document.getElementById('contactEmail').value = settings.contactEmail;
    document.getElementById('maintenanceMode').checked = settings.maintenanceMode;
}

function saveSettings() {
    const settings = loadAdminSettings();

    settings.siteName = document.getElementById('siteName').value;
    settings.description = document.getElementById('siteDescription').value;
    settings.minInvestment = parseFloat(document.getElementById('minInvestment').value);
    settings.starterFee = parseFloat(document.getElementById('starterFee').value);
    settings.professionalFee = parseFloat(document.getElementById('professionalFee').value);
    settings.premiumFee = parseFloat(document.getElementById('premiumFee').value);
    settings.contactEmail = document.getElementById('contactEmail').value;
    settings.maintenanceMode = document.getElementById('maintenanceMode').checked;

    localStorage.setItem('adminSettings', JSON.stringify(settings));

    // Update page title
    document.title = settings.siteName + ' - Digital Gold Investment Platform';

    showNotification('Settings saved successfully!', 'success');
}

function resetSettings() {
    const defaultSettings = getDefaultAdminSettings();
    localStorage.setItem('adminSettings', JSON.stringify(defaultSettings));
    loadSiteSettings();
    showNotification('Settings reset to default!', 'success');
}

function updateAdminPassword() {
    const newPassword = document.getElementById('newAdminPassword').value;

    if (!newPassword || newPassword.length < 6) {
        showNotification('Password must be at least 6 characters!', 'error');
        return;
    }

    const settings = loadAdminSettings();
    settings.adminPassword = newPassword;
    localStorage.setItem('adminSettings', JSON.stringify(settings));

    document.getElementById('newAdminPassword').value = '';
    showNotification('Admin password updated successfully!', 'success');
}

// ===== Price Simulation =====
function updateGoldPrice() {
    // Simulate price changes
    const basePrice = 1850;
    const randomChange = (Math.random() - 0.5) * 50; // Random change between -25 and 25
    const currentPrice = basePrice + randomChange;
    const change = randomChange;
    const changePercent = ((change / basePrice) * 100).toFixed(2);

    document.getElementById('goldPrice').textContent = '$' + currentPrice.toFixed(2);

    const priceChangeElement = document.getElementById('priceChange');
    if (change >= 0) {
        priceChangeElement.innerHTML = `
            <span class="change-up">↑ +$${change.toFixed(2)} (+${changePercent}%)</span>
            <span class="time">Last 24h</span>
        `;
    } else {
        priceChangeElement.innerHTML = `
            <span style="color: var(--danger-color); font-weight: bold;">↓ $${change.toFixed(2)} (${changePercent}%)</span>
            <span class="time">Last 24h</span>
        `;
    }
}

// ===== Investment Calculator =====
function calculateInvestment() {
    const principal = parseFloat(document.getElementById('investmentAmount').value) || 1000;
    const years = parseFloat(document.getElementById('investmentYears').value) || 5;
    const annualReturn = parseFloat(document.getElementById('annualReturn').value) || 5;

    // Compound Interest Formula: A = P(1 + r/100)^t
    const finalAmount = principal * Math.pow(1 + annualReturn / 100, years);
    const profit = finalAmount - principal;
    const roi = ((profit / principal) * 100).toFixed(2);

    document.getElementById('resultInitial').textContent = '$' + principal.toFixed(2);
    document.getElementById('resultFinal').textContent = '$' + finalAmount.toFixed(2);
    document.getElementById('resultProfit').textContent = '$' + profit.toFixed(2);
    document.getElementById('resultROI').textContent = roi + '%';
}

// Add event listeners for calculator
document.addEventListener('DOMContentLoaded', function() {
    const investmentAmountInput = document.getElementById('investmentAmount');
    const investmentYearsInput = document.getElementById('investmentYears');
    const annualReturnInput = document.getElementById('annualReturn');

    if (investmentAmountInput) {
        investmentAmountInput.addEventListener('input', calculateInvestment);
    }
    if (investmentYearsInput) {
        investmentYearsInput.addEventListener('input', calculateInvestment);
    }
    if (annualReturnInput) {
        annualReturnInput.addEventListener('input', calculateInvestment);
    }

    // Initial calculation
    calculateInvestment();

    // Update gold price
    updateGoldPrice();
    setInterval(updateGoldPrice, 3000); // Update every 3 seconds

    // Load user data
    loadUserData();

    // Load and apply admin theme settings
    const adminSettings = loadAdminSettings();
    applyThemeToDOM(adminSettings.theme);

    // Setup FAQ accordion
    setupFAQAccordion();

    // Setup mobile hamburger menu
    setupMobileMenu();

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const authModal = document.getElementById('authModal');
        const dashboardModal = document.getElementById('dashboardModal');
        const adminDashboardModal = document.getElementById('adminDashboardModal');
        const walletModal = document.getElementById('walletModal');

        if (event.target === authModal) {
            closeAuthModal();
        }
        if (event.target === dashboardModal) {
            closeDashboard();
        }
        if (event.target === adminDashboardModal) {
            closeAdminDashboard();
        }
        if (event.target === walletModal) {
            closeWalletModal();
        }
    });
});

// ===== FAQ Accordion =====
function setupFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            faqItem.classList.toggle('active');

            // Close other open items
            document.querySelectorAll('.faq-item.active').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                }
            });
        });
    });
}

// ===== Mobile Menu =====
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close menu when link is clicked
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
            });
        });
    }
}

// ===== Smooth Scrolling =====
function scrollToSection(sectionId) {
    const element = document.querySelector(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===== Utility Functions =====

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Get gold price
function getGoldPrice() {
    const priceElement = document.getElementById('goldPrice');
    if (priceElement) {
        const priceText = priceElement.textContent;
        return parseFloat(priceText.replace('$', ''));
    }
    return 1850; // Default price
}

// ===== Advanced Features =====

// User Portfolio Management
class Portfolio {
    constructor(user) {
        this.user = user;
        this.goldHoldings = user.portfolio.goldHoldings || 0;
        this.cashBalance = user.portfolio.balance || 5000;
    }

    buyGold(amount, pricePerOz) {
        const totalCost = amount * pricePerOz;
        if (totalCost > this.cashBalance) {
            alert('Insufficient balance');
            return false;
        }
        this.goldHoldings += amount;
        this.cashBalance -= totalCost;
        this.saveToStorage();
        return true;
    }

    sellGold(amount, pricePerOz) {
        if (amount > this.goldHoldings) {
            alert('Insufficient gold holdings');
            return false;
        }
        this.goldHoldings -= amount;
        this.cashBalance += amount * pricePerOz;
        this.saveToStorage();
        return true;
    }

    getPortfolioValue(currentGoldPrice) {
        return (this.goldHoldings * currentGoldPrice) + this.cashBalance;
    }

    saveToStorage() {
        if (this.user) {
            this.user.portfolio.goldHoldings = this.goldHoldings;
            this.user.portfolio.balance = this.cashBalance;
            localStorage.setItem('goldVaultUser', JSON.stringify(this.user));
        }
    }
}

// ===== Data Persistence =====

// Save user activity
function saveActivity(action, amount, price, total) {
    if (!currentUser) return;

    let activities = JSON.parse(localStorage.getItem('goldVaultActivities_' + currentUser.email) || '[]');

    activities.push({
        date: new Date().toISOString(),
        action: action,
        amount: amount,
        price: price,
        total: total
    });

    // Keep only last 50 activities
    if (activities.length > 50) {
        activities = activities.slice(-50);
    }

    localStorage.setItem('goldVaultActivities_' + currentUser.email, JSON.stringify(activities));
}

// Get user activities
function getActivities() {
    if (!currentUser) return [];
    return JSON.parse(localStorage.getItem('goldVaultActivities_' + currentUser.email) || '[]');
}

// ===== Analytics Functions =====

// Calculate portfolio statistics
function getPortfolioStats() {
    if (!currentUser) return null;

    const portfolio = new Portfolio(currentUser);
    const goldPrice = getGoldPrice();
    const portfolioValue = portfolio.getPortfolioValue(goldPrice);

    return {
        totalValue: portfolioValue,
        goldHoldings: portfolio.goldHoldings,
        cashBalance: portfolio.cashBalance,
        goldValue: portfolio.goldHoldings * goldPrice,
        percentageInGold: (portfolio.goldHoldings > 0) ? ((portfolio.goldHoldings * goldPrice) / portfolioValue * 100).toFixed(2) : 0
    };
}

// ===== Notification System =====

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#00d084' : type === 'error' ? '#ff4444' : '#ffd700'};
        color: ${type === 'info' ? '#000' : '#fff'};
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInRight 0.3s;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== Export Functions =====

// Export portfolio data as CSV
function exportPortfolioAsCSV() {
    if (!currentUser) {
        alert('Please login first');
        return;
    }

    const stats = getPortfolioStats();
    const activities = getActivities();

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'GoldVault Portfolio Report\n';
    csvContent += `User: ${currentUser.name} (${currentUser.email})\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    csvContent += 'Portfolio Summary\n';
    csvContent += `Total Value,${stats.totalValue.toFixed(2)}\n`;
    csvContent += `Gold Holdings,${stats.goldHoldings.toFixed(6)} oz\n`;
    csvContent += `Cash Balance,${stats.cashBalance.toFixed(2)}\n`;
    csvContent += `Gold Percentage,${stats.percentageInGold}%\n\n`;
    csvContent += 'Transaction History\n';
    csvContent += 'Date,Action,Amount (oz),Price/oz,Total\n';

    activities.forEach(activity => {
        csvContent += `${formatDate(activity.date)},${activity.action},${activity.amount.toFixed(6)},${activity.price.toFixed(2)},${activity.total.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `goldvault_portfolio_${currentUser.email}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}

// ===== API Simulation =====

// Simulate API calls for future integration
const APISimulator = {
    fetchGoldPrice: async function() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    price: getGoldPrice(),
                    currency: 'USD',
                    unit: 'oz',
                    timestamp: new Date().toISOString()
                });
            }, 500);
        });
    },

    fetchMarketData: async function() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    dayOpen: 1840,
                    dayHigh: 1860,
                    dayLow: 1835,
                    dayChange: Math.random() * 50 - 25,
                    volume: Math.floor(Math.random() * 1000000)
                });
            }, 500);
        });
    },

    executeTransaction: async function(action, amount, price) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: 'TXN' + Date.now(),
                    timestamp: new Date().toISOString()
                });
            }, 1000);
        });
    }
};

// ===== Particle Background System =====
function createParticles() {
    const particlesContainer = document.getElementById('particlesContainer');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random positioning
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Random size
        const size = Math.random() * 6 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        // Random animation delay
        const delay = Math.random() * 20;
        particle.style.animationDelay = delay + 's';

        particlesContainer.appendChild(particle);
    }
}

// ===== Advanced Scroll Effects =====
function handleScroll() {
    const navbar = document.querySelector('.navbar');
    const scrolled = window.scrollY > 50;

    if (scrolled) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// ===== Enhanced Animations =====
function addIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all feature cards, plan cards, and sections
    document.querySelectorAll('.feature-card, .plan-card, .faq-item, .stat').forEach(card => {
        observer.observe(card);
    });
}

// ===== Enhanced Mobile Menu =====
function initializeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

// ===== Typing Effect for Hero =====
function createTypingEffect() {
    const heroTitle = document.querySelector('.hero h1');
    if (!heroTitle) return;

    const originalText = heroTitle.textContent;
    heroTitle.textContent = '';

    let i = 0;
    const timer = setInterval(() => {
        if (i < originalText.length) {
            heroTitle.textContent += originalText.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, 100);
}

// ===== Advanced Hover Effects =====
function addAdvancedHoverEffects() {
    // Enhanced button hover effects
    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-invest').forEach(btn => {
        btn.addEventListener('mouseenter', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.style.setProperty('--mouse-x', x + 'px');
            this.style.setProperty('--mouse-y', y + 'px');
        });
    });

    // Card hover effects
    document.querySelectorAll('.feature-card, .plan-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            this.style.boxShadow = 'var(--shadow-heavy)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
}

// ===== Performance Optimization =====
function optimizePerformance() {
    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(function() {
                handleScroll();
                scrollTimeout = null;
            }, 16);
        }
    });

    // Lazy load images if any (placeholder for future images)
    const images = document.querySelectorAll('img[data-src]');
    if (images.length > 0) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// ===== Notification Enhancements =====
function showEnhancedNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Add icon based on type
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';

    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        color: var(--text-color);
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius-md);
        z-index: 3000;
        animation: slideInEnhanced 0.4s ease-out;
        box-shadow: var(--shadow-medium);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 300px;
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutEnhanced 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Enhanced notification animations
const notificationStyles = `
    @keyframes slideInEnhanced {
        from {
            transform: translateX(400px) scale(0.8);
            opacity: 0;
        }
        to {
            transform: translateX(0) scale(1);
            opacity: 1;
        }
    }
    @keyframes slideOutEnhanced {
        from {
            transform: translateX(0) scale(1);
            opacity: 1;
        }
        to {
            transform: translateX(400px) scale(0.8);
            opacity: 0;
        }
    }

    .notification-close {
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        font-size: 1.2rem;
        margin-left: auto;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all var(--transition-fast);
    }

    .notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-color);
    }
`;

const notificationStyleSheet = document.createElement('style');
notificationStyleSheet.textContent = notificationStyles;
document.head.appendChild(notificationStyleSheet);

// Override the original showNotification function
window.showNotification = showEnhancedNotification;

// ===== Profile Menu Functions =====
function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Close profile menu when clicking outside
document.addEventListener('click', function(event) {
    const profileMenu = document.querySelector('.profile-menu');
    const dropdown = document.getElementById('profileDropdown');

    if (!profileMenu.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// ===== Profile Modal Functions =====
function openProfileModal() {
    if (!isLoggedIn || !currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    document.getElementById('profileModal').classList.add('show');
    loadProfileData();
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('show');
}

function loadProfileData() {
    if (!currentUser) return;

    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileUsername').value = currentUser.username || '';
    document.getElementById('profileBio').value = currentUser.bio || '';

    document.getElementById('currentAvatar').textContent = currentUser.avatar || '👤';
}

function changeAvatar(avatar) {
    document.getElementById('currentAvatar').textContent = avatar;
}

function updateProfile(event) {
    event.preventDefault();

    if (!currentUser) return;

    const name = document.getElementById('profileName').value.trim();
    const username = document.getElementById('profileUsername').value.trim();
    const bio = document.getElementById('profileBio').value.trim();
    const avatar = document.getElementById('currentAvatar').textContent;

    if (!name || !username) {
        showNotification('Name and username are required', 'error');
        return;
    }

    // Update user data
    currentUser.name = name;
    currentUser.username = username;
    currentUser.bio = bio;
    currentUser.avatar = avatar;

    // Save to localStorage
    localStorage.setItem('goldVaultUser_' + currentUser.email, JSON.stringify(currentUser));
    localStorage.setItem('goldVaultUser', JSON.stringify(currentUser));

    // Update navigation
    document.getElementById('navUserName').textContent = name;
    document.querySelector('.profile-avatar').textContent = avatar;

    showNotification('Profile updated successfully!', 'success');
    closeProfileModal();
}

// ===== Deposit Modal Functions =====
function openDepositModal() {
    if (!isLoggedIn || !currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    document.getElementById('depositModal').classList.add('show');
}

function closeDepositModal() {
    document.getElementById('depositModal').classList.remove('show');
}

function switchDepositMethod(method) {
    // Hide all methods
    document.querySelectorAll('.deposit-method').forEach(method => {
        method.classList.remove('active');
    });

    // Remove active from tabs
    document.querySelectorAll('.method-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected method
    document.getElementById(method + 'Method').classList.add('active');
    event.target.classList.add('active');
}

function processDeposit(event, method) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('depositAmount').value);

    if (!amount || amount < 10 || amount > 10000) {
        showNotification('Please enter a valid amount between $10 and $10,000', 'error');
        return;
    }

    // Update user balance
    if (!currentUser.portfolio) {
        currentUser.portfolio = { balance: 50000, goldHoldings: 0 };
    }

    currentUser.portfolio.balance += amount;

    // Save to localStorage
    localStorage.setItem('goldVaultUser_' + currentUser.email, JSON.stringify(currentUser));
    localStorage.setItem('goldVaultUser', JSON.stringify(currentUser));

    showNotification(`Successfully deposited $${amount.toFixed(2)}!`, 'success');
    closeDepositModal();

    // Show transaction history
    setTimeout(() => {
        openProfileModal();
        setTimeout(() => switchProfileTab('transactions'), 100);
    }, 500);

    // Clear form
    document.getElementById('depositAmount').value = '';
    document.getElementById('depositBtnAmount').textContent = '0';
}

function processBankDeposit() {
    const amount = parseFloat(document.getElementById('bankDepositAmount').value);

    if (!amount || amount < 100 || amount > 50000) {
        showNotification('Please enter a valid amount between $100 and $50,000', 'error');
        return;
    }

    showNotification(`Bank transfer initiated for $${amount.toFixed(2)}. Reference: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 'success');
    closeDepositModal();
}

function selectCrypto(crypto) {
    document.querySelectorAll('.crypto-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');

    const addresses = {
        'BTC': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        'ETH': '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        'USDT': 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuW9',
        'BNB': 'bnb1u2kgp745f8j2jvf0c6h2e8j2q9j2q9j2q9j2q9'
    };

    document.getElementById('walletAddress').textContent = addresses[crypto] || 'Address not available';
}

function generateCryptoAddress() {
    const amount = parseFloat(document.getElementById('cryptoDepositAmount').value);

    if (!amount || amount < 25 || amount > 25000) {
        showNotification('Please enter a valid amount between $25 and $25,000', 'error');
        return;
    }

    document.getElementById('cryptoAddress').style.display = 'block';
    showNotification('Crypto payment address generated!', 'success');
}

function copyAddress() {
    const address = document.getElementById('walletAddress').textContent;
    navigator.clipboard.writeText(address).then(() => {
        showNotification('Address copied to clipboard!', 'success');
    });
}

// ===== Withdrawal Modal Functions =====
function openWithdrawalModal() {
    if (!isLoggedIn || !currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    document.getElementById('withdrawalModal').classList.add('show');
    updateAvailableBalance();
}

function closeWithdrawalModal() {
    document.getElementById('withdrawalModal').classList.remove('show');
}

function updateAvailableBalance() {
    const balance = currentUser.portfolio ? currentUser.portfolio.balance : 0;
    document.getElementById('availableBalance').textContent = '$' + balance.toFixed(2);
}

function switchWithdrawalMethod(method) {
    // Hide all methods
    document.querySelectorAll('.withdrawal-method').forEach(method => {
        method.classList.remove('active');
    });

    // Remove active from tabs
    document.querySelectorAll('.method-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected method
    document.getElementById(method + 'WithdrawalMethod').classList.add('active');
    event.target.classList.add('active');
}

function processWithdrawal(event, method) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const upiId = document.getElementById('upiId').value.trim();
    const balance = currentUser.portfolio ? currentUser.portfolio.balance : 0;

    if (!amount || amount < 50 || amount > 5000) {
        showNotification('Please enter a valid amount between ₹50 and ₹5,000', 'error');
        return;
    }

    if (!upiId) {
        showNotification('Please enter your UPI ID', 'error');
        return;
    }

    if (amount > balance) {
        showNotification('Insufficient balance', 'error');
        return;
    }

    // Create withdrawal request
    const withdrawalRequest = {
        id: 'WD' + Date.now(),
        userEmail: currentUser.email,
        userName: currentUser.name,
        amount: amount,
        upiId: upiId,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        method: method
    };

    // Store withdrawal request
    const withdrawalRequests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
    withdrawalRequests.push(withdrawalRequest);
    localStorage.setItem('withdrawalRequests', JSON.stringify(withdrawalRequests));

    showNotification(`Withdrawal request for ₹${amount.toLocaleString('en-IN')} submitted successfully!`, 'success');
    closeWithdrawalModal();

    // Clear form
    document.getElementById('withdrawalAmount').value = '';
    document.getElementById('upiId').value = '';
}

// ===== Sports Betting Modal Functions =====
function openSportsModal() {
    if (!isLoggedIn || !currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    document.getElementById('sportsModal').classList.add('show');
    initializeBettingBalance();
}

function closeSportsModal() {
    document.getElementById('sportsModal').classList.remove('show');
}

// ===== Wallet Modal Functions =====
function openWalletModal() {
    if (!isLoggedIn || !currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    document.getElementById('walletModal').classList.add('show');
    updateWalletData();
}

function closeWalletModal() {
    document.getElementById('walletModal').classList.remove('show');
}

function updateWalletData() {
    if (!currentUser) return;

    // Update balance
    const balance = currentUser.portfolio ? currentUser.portfolio.balance : 50000;
    document.getElementById('walletBalance').textContent = '₹' + balance.toLocaleString('en-IN', {maximumFractionDigits: 0});

    // Update recent activity
    const transactions = JSON.parse(localStorage.getItem('userTransactions_' + currentUser.email) || '[]');
    const activityList = document.getElementById('walletActivity');

    if (transactions.length === 0) {
        activityList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 1rem;">No recent activity</p>';
        return;
    }

    // Show last 3 transactions
    let html = '';
    transactions.slice().reverse().slice(0, 3).forEach(tx => {
        const date = new Date(tx.date);
        const dateStr = date.toLocaleDateString('en-IN', {month: 'short', day: 'numeric'});
        const badge = tx.type === 'buy' ? '<span class="activity-badge buy">💰 Deposit</span>' : '<span class="activity-badge sell">💸 Withdrawal</span>';

        html += `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-date">${dateStr}</span>
                    <span class="activity-amount">₹${tx.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                ${badge}
            </div>
        `;
    });

    activityList.innerHTML = html;
}

function initializeBettingBalance() {
    if (!currentUser.bettingBalance) {
        currentUser.bettingBalance = 0;
    }
    document.getElementById('bettingBalance').textContent = '$' + currentUser.bettingBalance.toFixed(2);
}

function addBettingFunds() {
    const amount = prompt('Enter amount to add to betting balance:');
    const numAmount = parseFloat(amount);

    if (numAmount && numAmount > 0) {
        if (!currentUser.portfolio || currentUser.portfolio.balance < numAmount) {
            showNotification('Insufficient funds in your main account', 'error');
            return;
        }

        currentUser.portfolio.balance -= numAmount;
        currentUser.bettingBalance = (currentUser.bettingBalance || 0) + numAmount;

        // Save to localStorage
        localStorage.setItem('goldVaultUser_' + currentUser.email, JSON.stringify(currentUser));
        localStorage.setItem('goldVaultUser', JSON.stringify(currentUser));

        document.getElementById('bettingBalance').textContent = '$' + currentUser.bettingBalance.toFixed(2);
        showNotification(`Added $${numAmount.toFixed(2)} to betting balance!`, 'success');
    }
}

function switchSportsCategory(category) {
    // Hide all categories
    document.querySelectorAll('.sports-category').forEach(cat => {
        cat.classList.remove('active');
    });

    // Remove active from tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected category
    document.getElementById(category + 'Category').classList.add('active');
    event.target.classList.add('active');
}

let currentBets = [];

function placeBet(team, odds) {
    const betAmount = prompt(`Enter bet amount for ${team} (${odds}x):`);

    if (betAmount && parseFloat(betAmount) > 0) {
        const amount = parseFloat(betAmount);
        const balance = currentUser.bettingBalance || 0;

        if (amount > balance) {
            showNotification('Insufficient betting balance', 'error');
            return;
        }

        currentBets.push({
            team: team,
            odds: odds,
            amount: amount,
            potentialWin: amount * odds
        });

        updateBettingSlip();
        document.getElementById('bettingSlip').style.display = 'block';
    }
}

function updateBettingSlip() {
    const betsList = document.getElementById('betsList');
    const totalStake = document.getElementById('totalStake');
    const potentialWin = document.getElementById('potentialWin');

    let totalStakeAmount = 0;
    let totalPotentialWin = 0;

    betsList.innerHTML = '';

    currentBets.forEach((bet, index) => {
        totalStakeAmount += bet.amount;
        totalPotentialWin += bet.potentialWin;

        const betItem = document.createElement('div');
        betItem.className = 'bet-item';
        betItem.innerHTML = `
            <div class="bet-info">
                <span class="bet-team">${bet.team}</span>
                <span class="bet-odds">${bet.odds}x</span>
                <span class="bet-amount">$${bet.amount.toFixed(2)}</span>
            </div>
            <button class="remove-bet" onclick="removeBet(${index})">❌</button>
        `;
        betsList.appendChild(betItem);
    });

    totalStake.textContent = '$' + totalStakeAmount.toFixed(2);
    potentialWin.textContent = '$' + totalPotentialWin.toFixed(2);
}

function removeBet(index) {
    currentBets.splice(index, 1);
    updateBettingSlip();

    if (currentBets.length === 0) {
        document.getElementById('bettingSlip').style.display = 'none';
    }
}

function confirmBets() {
    if (currentBets.length === 0) {
        showNotification('No bets to place', 'error');
        return;
    }

    let totalStake = 0;
    currentBets.forEach(bet => {
        totalStake += bet.amount;
    });

    if (totalStake > currentUser.bettingBalance) {
        showNotification('Insufficient betting balance', 'error');
        return;
    }

    // Deduct from betting balance
    currentUser.bettingBalance -= totalStake;

    // Save bets to user data
    if (!currentUser.bets) {
        currentUser.bets = [];
    }
    currentUser.bets.push(...currentBets);

    // Save to localStorage
    localStorage.setItem('goldVaultUser_' + currentUser.email, JSON.stringify(currentUser));
    localStorage.setItem('goldVaultUser', JSON.stringify(currentUser));

    document.getElementById('bettingBalance').textContent = '$' + currentUser.bettingBalance.toFixed(2);

    showNotification(`Successfully placed ${currentBets.length} bet(s)!`, 'success');

    // Reset betting slip
    currentBets = [];
    document.getElementById('bettingSlip').style.display = 'none';

    closeSportsModal();
}

// ===== UPI Payment Functions =====
let currentUPIAmount = 0;

function selectUPIAmount(amount) {
    currentUPIAmount = amount;
    document.getElementById('upiAmount').textContent = '₹' + amount.toLocaleString('en-IN');
    document.getElementById('customUPIAmount').value = amount;

    // Highlight selected button
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function updateCustomUPIAmount() {
    const customAmount = parseInt(document.getElementById('customUPIAmount').value) || 0;
    currentUPIAmount = customAmount;
    document.getElementById('upiAmount').textContent = '₹' + customAmount.toLocaleString('en-IN');

    // Remove selection from preset buttons
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function generateUPIQR() {
    if (currentUPIAmount < 1) {
        showNotification('Please select or enter an amount', 'error');
        return;
    }

    if (currentUPIAmount > 50000) {
        showNotification('Maximum amount is ₹50,000', 'error');
        return;
    }

    // Generate QR code (simulated - in real implementation, use a QR code library)
    const qrCodeDiv = document.getElementById('upiQRCode');
    qrCodeDiv.innerHTML = `
        <div class="qr-code-generated">
            <div class="qr-pattern">
                <div class="qr-corner tl"></div>
                <div class="qr-corner tr"></div>
                <div class="qr-corner bl"></div>
                <div class="qr-data">
                    <div class="qr-row">
                        <div class="qr-cell black"></div>
                        <div class="qr-cell white"></div>
                        <div class="qr-cell black"></div>
                        <div class="qr-cell white"></div>
                        <div class="qr-cell black"></div>
                    </div>
                    <div class="qr-row">
                        <div class="qr-cell white"></div>
                        <div class="qr-cell black"></div>
                        <div class="qr-cell black"></div>
                        <div class="qr-cell black"></div>
                        <div class="qr-cell white"></div>
                    </div>
                    <div class="qr-row">
                        <div class="qr-cell black"></div>
                        <div class="qr-cell white"></div>
                        <div class="qr-cell white"></div>
                        <div class="qr-cell white"></div>
                        <div class="qr-cell black"></div>
                    </div>
                    <div class="qr-row">
                        <div class="qr-cell white"></div>
                        <div class="qr-cell black"></div>
                        <div class="qr-cell black"></div>
                        <div class="qr-cell black"></div>
                        <div class="qr-cell white"></div>
                    </div>
                    <div class="qr-row">
                        <div class="qr-cell black"></div>
                        <div class="qr-cell white"></div>
                        <div class="qr-cell black"></div>
                        <div class="qr-cell white"></div>
                        <div class="qr-cell black"></div>
                    </div>
                </div>
                <div class="qr-corner br"></div>
            </div>
        </div>
    `;

    showNotification('QR Code generated! Scan with your UPI app to pay.', 'success');

    // Simulate payment completion after 3 seconds (for demo purposes)
    setTimeout(() => {
        if (isLoggedIn && currentUser) {
            // Add amount to user balance (convert to USD approximately)
            const usdAmount = currentUPIAmount / 83; // Approximate INR to USD conversion
            if (!currentUser.portfolio) {
                currentUser.portfolio = { balance: 50000, goldHoldings: 0 };
            }
            currentUser.portfolio.balance += usdAmount;

            // Save to localStorage
            localStorage.setItem('goldVaultUser_' + currentUser.email, JSON.stringify(currentUser));
            localStorage.setItem('goldVaultUser', JSON.stringify(currentUser));

            showNotification(`Payment successful! ₹${currentUPIAmount.toLocaleString('en-IN')} added to your account.`, 'success');

            // Update wallet balance display
            updateWalletData();
        }
    }, 3000);
}

function copyUPIId() {
    const upiId = document.getElementById('upiId').textContent;
    navigator.clipboard.writeText(upiId).then(() => {
        showNotification('UPI ID copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = upiId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('UPI ID copied to clipboard!', 'success');
    });
}

// ===== Update Profile Icon Display =====
function updateProfileIcon() {
    const profileIcon = document.getElementById('profileIcon');
    const navUserName = document.getElementById('navUserName');
    const loginBtn = document.querySelector('.btn-login');

    if (isLoggedIn && currentUser) {
        profileIcon.style.display = 'flex';
        navUserName.textContent = currentUser.name || 'User';

        const avatarElement = document.querySelector('.profile-avatar');
        if (avatarElement) {
            avatarElement.textContent = currentUser.avatar || '👤';
        }

        // Hide login button when logged in
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
    } else {
        profileIcon.style.display = 'none';

        // Show login button when logged out
        if (loginBtn) {
            loginBtn.style.display = 'inline-block';
        }
    }
}

// ===== Profile Tab Functions =====
function switchProfileTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.profile-tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab content
    const selectedTabContent = document.getElementById(tabName + 'Tab');
    if (selectedTabContent) {
        selectedTabContent.classList.add('active');
    }

    // Add active class to selected tab
    const selectedTab = document.querySelector(`[onclick="switchProfileTab('${tabName}')"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Load transactions if transactions tab is selected
    if (tabName === 'transactions') {
        loadUserTransactions();
    }
}

// ===== Transaction Functions =====
function loadUserTransactions() {
    // In a real application, this would fetch data from the server
    // For now, we'll use sample data
    const sampleTransactions = [
        {
            type: 'Deposit',
            amount: '₹1,000',
            date: '2024-01-15 14:30',
            status: 'completed'
        },
        {
            type: 'Withdrawal',
            amount: '₹500',
            date: '2024-01-14 10:15',
            status: 'pending'
        },
        {
            type: 'Deposit',
            amount: '₹2,000',
            date: '2024-01-13 16:45',
            status: 'cancelled'
        }
    ];

    displayTransactions(sampleTransactions);
}

function filterTransactions(type) {
    // Remove active class from all filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));

    // Add active class to clicked button
    const clickedButton = document.querySelector(`[onclick="filterTransactions('${type}')"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // In a real application, this would filter transactions from server data
    // For now, we'll use sample data
    let filteredTransactions = [];

    if (type === 'all') {
        filteredTransactions = [
            {
                type: 'Deposit',
                amount: '₹1,000',
                date: '2024-01-15 14:30',
                status: 'completed'
            },
            {
                type: 'Withdrawal',
                amount: '₹500',
                date: '2024-01-14 10:15',
                status: 'pending'
            },
            {
                type: 'Deposit',
                amount: '₹2,000',
                date: '2024-01-13 16:45',
                status: 'cancelled'
            }
        ];
    } else if (type === 'deposit') {
        filteredTransactions = [
            {
                type: 'Deposit',
                amount: '₹1,000',
                date: '2024-01-15 14:30',
                status: 'completed'
            },
            {
                type: 'Deposit',
                amount: '₹2,000',
                date: '2024-01-13 16:45',
                status: 'cancelled'
            }
        ];
    } else if (type === 'withdrawal') {
        filteredTransactions = [
            {
                type: 'Withdrawal',
                amount: '₹500',
                date: '2024-01-14 10:15',
                status: 'pending'
            }
        ];
    }

    displayTransactions(filteredTransactions);
}

function displayTransactions(transactions) {
    const transactionsList = document.getElementById('transactionsList');
    const noTransactions = document.getElementById('noTransactions');

    if (transactions.length === 0) {
        transactionsList.innerHTML = '';
        noTransactions.style.display = 'block';
        return;
    }

    noTransactions.style.display = 'none';

    const transactionsHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-type">${transaction.type}</div>
                <div class="transaction-amount">${transaction.amount}</div>
                <div class="transaction-date">${transaction.date}</div>
            </div>
            <div class="transaction-status">
                <span class="status-badge ${transaction.status}">${transaction.status}</span>
            </div>
        </div>
    `).join('');

    transactionsList.innerHTML = transactionsHTML;
}

// Override login function to update profile icon
const originalHandleLogin = handleLogin;
handleLogin = function(event) {
    originalHandleLogin(event);
    updateProfileIcon();
};

// Override signup function to update profile icon
const originalHandleSignup = handleSignup;
handleSignup = function(event) {
    originalHandleSignup(event);
    updateProfileIcon();
};

// Override logout function to update profile icon
const originalHandleLogout = handleLogout;
handleLogout = function() {
    originalHandleLogout();
    updateProfileIcon();
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user was previously logged in
    if (isLoggedIn && currentUser) {
        // Could restore user session here
    }

    // Initialize advanced features
    createParticles();
    addIntersectionObserver();
    initializeMobileMenu();
    addAdvancedHoverEffects();
    optimizePerformance();
    updateProfileIcon();

    // Create typing effect after a short delay
    setTimeout(createTypingEffect, 500);

    // Initial scroll check
    handleScroll();
});
