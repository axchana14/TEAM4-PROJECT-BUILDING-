const SECTORS = {
    hospital: { name: "Medical Center", theme: "hospital", departments: [{ id: 'OPD', name: 'Outpatient Dept', icon: 'stethoscope', avgTime: 12 }, { id: 'LAB', name: 'Laboratory', icon: 'test-tube', avgTime: 8 }, { id: 'PHA', name: 'Pharmacy', icon: 'pill', avgTime: 5 }, { id: 'EMG', name: 'Emergency', icon: 'ambulance', avgTime: 2 }] },
    banking: { name: "National Bank", theme: "banking", departments: [{ id: 'CSH', name: 'Cashier/Teller', icon: 'banknote', avgTime: 4 }, { id: 'LOA', name: 'Loans & Credit', icon: 'landmark', avgTime: 15 }, { id: 'ACC', name: 'New Accounts', icon: 'user-plus', avgTime: 10 }, { id: 'FX', name: 'Foreign Exchange', icon: 'repeat', avgTime: 6 }] },
    government: { name: "Civic Services", theme: "government", departments: [{ id: 'PAS', name: 'Passport Services', icon: 'globe', avgTime: 20 }, { id: 'TAX', name: 'Revenue/Tax', icon: 'calculator', avgTime: 15 }, { id: 'LIC', name: 'Licensing', icon: 'file-text', avgTime: 12 }, { id: 'SOC', name: 'Social Benefits', icon: 'heart', avgTime: 10 }] },
    supermarket: { name: "Grand Supermarket", theme: "supermarket", departments: [{ id: 'DEL', name: 'Deli Counter', icon: 'utensils', avgTime: 5 }, { id: 'BAK', name: 'Bakery Fresh', icon: 'wheat', avgTime: 3 }, { id: 'CHK', name: 'Priority Checkout', icon: 'shopping-cart', avgTime: 2 }, { id: 'SRV', name: 'Customer Service', icon: 'help-circle', avgTime: 8 }] },
    restaurant: { name: "Dine & Joy", theme: "restaurant", departments: [{ id: 'TBL', name: 'Table Booking', icon: 'utensils-crosses', avgTime: 20 }, { id: 'TKW', name: 'Takeaway Order', icon: 'package', avgTime: 10 }, { id: 'BAR', name: 'Bar & Drinks', icon: 'glass-water', avgTime: 5 }, { id: 'COL', name: 'Order Collection', icon: 'check-circle', avgTime: 2 }] },
    salon: { name: "Elite Salon & Spa", theme: "salon", departments: [{ id: 'CUT', name: 'Hair Cutting', icon: 'scissors', avgTime: 15 }, { id: 'NAI', name: 'Nail Art', icon: 'sparkles', avgTime: 25 }, { id: 'MAS', name: 'Therapy/Massage', icon: 'flower-2', avgTime: 40 }, { id: 'REC', name: 'Reception Desk', icon: 'concierge-bell', avgTime: 5 }] },
    telecom: { name: "Telecom Express", theme: "telecom", departments: [{ id: 'BIL', name: 'Bill Payment', icon: 'receipt', avgTime: 5 }, { id: 'NEW', name: 'New Connection', icon: 'smartphone', avgTime: 15 }, { id: 'TEC', name: 'Tech Support', icon: 'wrench', avgTime: 12 }, { id: 'WAR', name: 'Warranty Claim', icon: 'shield', avgTime: 10 }] },
    general: { name: "Service Hub", theme: "general", departments: [{ id: 'SR1', name: 'Service Counter A', icon: 'clipboard', avgTime: 5 }, { id: 'SR2', name: 'Service Counter B', icon: 'clipboard-list', avgTime: 5 }, { id: 'INF', name: 'Information Desk', icon: 'info', avgTime: 3 }, { id: 'SPT', name: 'Technical Support', icon: 'settings', avgTime: 12 }] }
};

let state = {
    activeSector: 'hospital',
    tokens: [],
    users: [],
    currentUser: null,
    currentView: 'home',
    selectedDept: null,
    pendingBooking: null,
    activeCounter: "1"
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initLucide();
    loadState();
    setupNav();
    updateAuthUI();
    setupSectorSelector();
    refreshViews();

    window.addEventListener('storage', () => {
        loadState();
        refreshViews();
        updateAuthUI();
    });

    setTimeout(() => {
        showToast(`Welcome to ${SECTORS[state.activeSector].name}. System generalized for all sectors.`, "accent");
    }, 1500);
});

function initLucide() {
    if (window.lucide) lucide.createIcons();
}

function loadState() {
    const saved = localStorage.getItem('queue_state_v3');
    if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
    }

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
    }

    const savedSector = localStorage.getItem('activeSector');
    if (savedSector && SECTORS[savedSector]) {
        state.activeSector = savedSector;
    }
}

function saveState() {
    localStorage.setItem('queue_state_v3', JSON.stringify({
        tokens: state.tokens,
        users: state.users,
        activeSector: state.activeSector
    }));
    refreshViews();
}

// SECTOR LOGIC
function setupSectorSelector() {
    const selector = document.getElementById('sector-selector');
    if (!selector) return;

    selector.value = state.activeSector;
    selector.addEventListener('change', (e) => {
        state.activeSector = e.target.value;
        localStorage.setItem('activeSector', state.activeSector);
        showToast(`Switched to ${SECTORS[state.activeSector].name}`, "primary");
        refreshViews();
    });
}

// NAVIGATION & VIEWS
function setupNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.target.getAttribute('onclick')) return; // Allow proper redirects
            e.preventDefault();
            const view = e.target.getAttribute('data-view');
            switchView(view);
        });
    });
}

function switchView(viewId) {
    if (state.currentView === viewId) return;

    const currentSection = document.getElementById(`${state.currentView}-view`);
    const nextSection = document.getElementById(`${viewId}-view`);

    if (currentSection) currentSection.classList.remove('view-active');
    if (nextSection) {
        nextSection.classList.add('view-active');
        state.currentView = viewId;
        refreshViews();
    }

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-view') === viewId);
    });
}

function refreshViews() {
    if (state.currentView === 'profile') refreshProfile();
    
    // Update terminology
    const logo = document.querySelector('.logo span');
    if (logo && SECTORS[state.activeSector]) {
        // Can optionally update title based on sector
    }
}

// AUTHENTICATION LOGIC
function openAuthModal(mode) {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('auth-modal').style.display = 'block';
    toggleAuthForm(mode);

    setTimeout(() => {
        const firstInput = document.getElementById(`${mode}-form`).querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);
}

function toggleAuthForm(mode) {
    const forms = ['login', 'signup', 'forgot'];
    forms.forEach(f => {
        const el = document.getElementById(`${f}-form`);
        if (el) el.style.display = 'none';
    });
    const active = document.getElementById(`${mode}-form`);
    if (active) active.style.display = 'block';
}

function closeAllModals() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('auth-modal').style.display = 'none';
}

function setGuestMode() {
    state.currentUser = { id: 'guest-' + Date.now(), name: 'Guest User', role: 'guest' };
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    updateAuthUI();
    showToast("Guest Mode Activated.", "primary");
    closeAllModals();
}

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return showToast("Fields required.", "warning");

    if (email.includes('staff')) {
        state.currentUser = { id: 'staff-1', name: 'Duty Manager', email: email, role: 'staff' };
    } else {
        const user = state.users.find(u => u.email === email && u.password === pass);
        if (user) {
            state.currentUser = { ...user, role: 'user' };
        } else {
            return showToast("Invalid credentials.", "danger");
        }
    }

    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    updateAuthUI();
    showToast(`Welcome, ${state.currentUser.name}`, "success");
    closeAllModals();
}

function handleSignup() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    if (!name || !email || !pass) return showToast("Fields required.", "warning");

    const newUser = { id: crypto.randomUUID(), name, email, password: pass, history: [] };
    state.users.push(newUser);
    state.currentUser = { ...newUser, role: 'user' };
    saveState();
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    updateAuthUI();
    showToast("Account created!", "success");
    closeAllModals();
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    switchView('home');
    showToast("Logged out.", "primary");
}

function updateAuthUI() {
    const controls = document.getElementById('auth-controls');
    const profile = document.getElementById('user-profile-badge');
    const links = controls.querySelectorAll('.auth-link');

    if (state.currentUser) {
        links.forEach(l => l.style.display = 'none');
        profile.style.display = 'flex';
        document.getElementById('user-display-name').innerText = state.currentUser.name;
    } else {
        links.forEach(l => l.style.display = 'block');
        profile.style.display = 'none';
    }
}

function refreshProfile() {
    if (state.currentUser.role === 'guest') {
        document.getElementById('profile-name').innerText = "Guest User";
        document.getElementById('profile-email').innerText = "Sessions only";
        document.getElementById('booking-history').innerHTML = "<p>Sign up for history.</p>";
        return;
    }
    const user = state.users.find(u => u.id === state.currentUser.id);
    document.getElementById('profile-name').innerText = user.name;
    document.getElementById('profile-email').innerText = user.email;
    document.getElementById('booking-history').innerHTML = user.history.map(h => `
        <div class="glass-card" style="padding: 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between;">
            <div><strong>${h.number}</strong><br><small>${h.sector.toUpperCase()}</small></div>
            <span>${h.status}</span>
        </div>
    `).join('') || "<p>No history.</p>";
}

function showToast(msg, type = 'primary') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderLeftColor = `var(--${type})`;
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 4000);
}

function scrollToFeatures() {
    const features = document.getElementById('features');
    if (features) {
        features.scrollIntoView({ behavior: 'smooth' });
    }
}
