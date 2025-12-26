const API_URL = '/api';

// State
let sessionToken = null;
let credentials = [];
const IDLE_TIMEOUT_MS = 300000; // 5 mins
let idleTimer;

// DOM Elements
const screens = {
    loading: document.getElementById('loading-screen'),
    setup: document.getElementById('setup-screen'),
    lock: document.getElementById('lock-screen'),
    recovery: document.getElementById('recovery-screen'),
    dashboard: document.getElementById('dashboard-screen')
};

// --- NAVIGATION ---
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    // Reset inputs on screen switch
    document.querySelectorAll('input').forEach(i => i.value = '');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

// --- AUTHENTICATION ---
async function checkInit() {
    try {
        const res = await fetch(`${API_URL}/auth/init`, { method: 'POST' });
        const data = await res.json();
        if (data.initialized) {
            showScreen('lock');
        } else {
            showScreen('setup');
        }
    } catch (e) {
        alert('Server connection failed');
    }
}

// Setup
document.getElementById('setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('setup-password').value;
    const p2 = document.getElementById('setup-confirm').value;
    const q = document.getElementById('setup-question').value;
    const a = document.getElementById('setup-answer').value;

    if (p1 !== p2) {
        document.getElementById('setup-error').innerText = "Passwords do not match";
        return;
    }

    const res = await fetch(`${API_URL}/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterPassword: p1, securityQuestion: q, securityAnswer: a })
    });

    if (res.ok) {
        showToast('Vault Initialized!');
        showScreen('lock');
    } else {
        const d = await res.json();
        document.getElementById('setup-error').innerText = d.error;
    }
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p = document.getElementById('login-password').value;

    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterPassword: p })
    });

    const data = await res.json();
    if (res.ok && data.token) {
        sessionToken = data.token;
        startIdleTimer();
        loadDashboard();
    } else {
        document.getElementById('login-error').innerText = data.error || 'Login failed';
    }
});

// Logout / Lock
document.getElementById('logout-btn').addEventListener('click', () => {
    lockVault();
});

function lockVault() {
    sessionToken = null;
    credentials = [];
    showScreen('lock');
}

// Idle Timer
function startIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(lockVault, IDLE_TIMEOUT_MS);
}
document.addEventListener('mousemove', () => { if (sessionToken) startIdleTimer(); });
document.addEventListener('keydown', () => { if (sessionToken) startIdleTimer(); });

// Recovery
document.getElementById('forgot-password-link').addEventListener('click', () => showScreen('recovery'));
document.getElementById('back-to-login').addEventListener('click', () => showScreen('lock'));

document.getElementById('recovery-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const a = document.getElementById('recovery-answer').value;
    const p = document.getElementById('recovery-new-password').value;

    const res = await fetch(`${API_URL}/auth/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ securityAnswer: a, newMasterPassword: p })
    });

    if (res.ok) {
        showToast('Password Reset Successful');
        showScreen('lock');
    } else {
        document.getElementById('recovery-error').innerText = 'Recovery failed';
    }
});

// --- DASHBOARD ---
async function loadDashboard() {
    showScreen('dashboard');
    const res = await fetch(`${API_URL}/credentials`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    if (res.ok) {
        credentials = await res.json();
        renderCredentials();
    } else {
        lockVault();
    }
}

function renderCredentials(filter = '') {
    const list = document.getElementById('credentials-list');
    list.innerHTML = '';

    const filtered = credentials.filter(c =>
        c.appName.toLowerCase().includes(filter.toLowerCase()) ||
        c.username.toLowerCase().includes(filter.toLowerCase())
    );

    // Group by appName (case-insensitive)
    const groups = {};
    filtered.forEach(c => {
        const normalizedApp = c.appName.trim().toLowerCase();
        if (!groups[normalizedApp]) {
            groups[normalizedApp] = {
                displayName: c.appName.charAt(0).toUpperCase() + c.appName.slice(1).toLowerCase(), // Capitalize first letter
                items: []
            };
        }
        groups[normalizedApp].items.push(c);
    });

    // Render groups
    Object.keys(groups).sort().forEach(groupKey => {
        const group = groups[groupKey];
        const groupItems = group.items;

        // Group Header
        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `
            <div class="group-title">${group.displayName}</div>
            <div class="group-count">${groupItems.length} accounts</div>
        `;
        list.appendChild(header);

        // Group Container for grid-like feel within group
        const groupContainer = document.createElement('div');
        groupContainer.className = 'grid-layout';

        groupItems.forEach(c => {
            const card = document.createElement('div');
            card.className = 'cred-card glass';
            card.innerHTML = `
                <div class="cred-header">
                    <div class="cred-app">${c.appName}</div>
                    <div class="cred-icons" onclick="deleteItem('${c._id}')">🗑️</div>
                </div>
                <div class="cred-user">${c.username}</div>
                <div class="cred-actions">
                    <button class="action-btn" onclick="copyUser('${c.username}')">Copy User</button>
                    <button class="action-btn" onclick="revealPass('${c._id}', this)">Show Pass</button>
                    <button class="action-btn" onclick="editItem('${c._id}')">Edit</button>
                </div>
            `;
            groupContainer.appendChild(card);
        });
        list.appendChild(groupContainer);
    });
}

document.getElementById('search-input').addEventListener('input', (e) => {
    if (sessionToken) renderCredentials(e.target.value);
});

async function revealPass(id, btn) {
    if (btn.innerText !== 'Show Pass') {
        btn.innerText = 'Show Pass';
        return; // Already showing, just toggle back text (logic simplified)
    }

    const res = await fetch(`${API_URL}/credentials/${id}/reveal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
    });

    if (res.ok) {
        const data = await res.json();
        const oldText = btn.innerText;
        btn.innerText = data.password;
        setTimeout(() => {
            btn.innerText = 'Show Pass';
        }, 5000); // Auto hide after 5s
    }
}

function copyUser(text) {
    navigator.clipboard.writeText(text);
    showToast('Username Copied');
}

async function deleteItem(id) {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`${API_URL}/credentials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    if (res.ok) {
        showToast('Deleted');
        loadDashboard();
    }
}

// --- MODAL ---
const modal = document.getElementById('item-modal');
document.getElementById('add-btn').addEventListener('click', () => {
    document.getElementById('credential-form').reset();
    document.getElementById('credential-id').value = '';
    document.getElementById('modal-title').innerText = 'Add Item';
    modal.classList.remove('hidden');
});
document.getElementById('modal-cancel').addEventListener('click', () => modal.classList.add('hidden'));

// Edit
window.editItem = (id) => {
    const item = credentials.find(c => c._id === id);
    if (!item) return;
    document.getElementById('cred-app').value = item.appName;
    document.getElementById('cred-username').value = item.username;
    document.getElementById('cred-notes').value = item.notes;
    document.getElementById('credential-id').value = id;
    document.getElementById('cred-password').value = ''; // Don't show existing pass
    document.getElementById('modal-title').innerText = 'Edit Item';
    modal.classList.remove('hidden');
};

// Toggle Modal Password Visibility
document.getElementById('toggle-modal-password').addEventListener('click', function () {
    const input = document.getElementById('cred-password');
    if (input.type === 'password') {
        input.type = 'text';
        this.style.opacity = '1';
    } else {
        input.type = 'password';
        this.style.opacity = '0.7';
    }
});

// Save Item (Add/Update)
document.getElementById('credential-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('credential-id').value;
    const payload = {
        appName: document.getElementById('cred-app').value,
        username: document.getElementById('cred-username').value,
        password: document.getElementById('cred-password').value,
        notes: document.getElementById('cred-notes').value,
    };

    console.log('Submitting credential:', { id, appName: payload.appName, username: payload.username, hasPassword: !!payload.password });

    let url = `${API_URL}/credentials`;
    let method = 'POST';

    if (id) {
        url = `${API_URL}/credentials/${id}`;
        method = 'PUT';
        // If password empty on edit, delete it from payload
        if (!payload.password) delete payload.password;
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', res.status);

        if (res.ok) {
            modal.classList.add('hidden');
            showToast('Saved Successfully');
            loadDashboard();
        } else {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Save failed:', errorData);
            alert('Save failed: ' + (errorData.error || 'Unknown error'));
        }
    } catch (err) {
        console.error('Network error:', err);
        alert('Save failed: Network error - ' + err.message);
    }
});


// Init
checkInit();
