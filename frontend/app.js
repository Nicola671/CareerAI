/**
 * CareerAI — Claude-Style Frontend
 * Full implementation connected to FastAPI backend
 */

// ===== CONFIG =====
const API_BASE = window.location.origin; // Same origin (served by FastAPI)

// ===== STATE =====
const state = {
    sidebarOpen: true,
    currentModel: 'llama-3.3-70b-versatile',
    currentModelDisplay: 'CareerAI Pro',
    messages: [],
    conversations: JSON.parse(localStorage.getItem('careerai_conversations') || '[]'),
    currentConversationId: null,
    documents: [],
    documentId: null,
    apiConfigured: false,
    apiKey: '',
    currentUser: null,
    authToken: localStorage.getItem('careerai_token') || null,
    authMode: 'login' // 'login', 'register', 'forgot', 'reset'
};

// ===== ELEMENTS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    sidebar: $('#sidebar'),
    toggleSidebar: $('#toggleSidebar'),
    mobileSidebarToggle: $('#mobileSidebarToggle'),
    newChatBtn: $('#newChatBtn'),
    searchInput: $('#searchInput'),
    conversationList: $('#conversationList'),
    documentList: $('#documentList'),

    mainContent: $('#mainContent'),
    welcomeScreen: $('#welcomeScreen'),
    chatScreen: $('#chatScreen'),
    chatMessages: $('#chatMessages'),

    welcomeInput: $('#welcomeInput'),
    chatInput: $('#chatInput'),
    sendBtn: $('#sendBtn'),
    chatSendBtn: $('#chatSendBtn'),

    attachBtn: $('#attachBtn'),
    chatAttachBtn: $('#chatAttachBtn'),

    modelSelector: $('#modelSelector'),
    chatModelSelector: $('#chatModelSelector'),
    modelDropdown: $('#modelDropdown'),

    uploadModal: $('#uploadModal'),
    uploadBackdrop: $('#uploadBackdrop'),
    uploadClose: $('#uploadClose'),
    uploadDropzone: $('#uploadDropzone'),
    fileInput: $('#fileInput'),

    notificationBar: $('#notificationBar'),
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupSidebar();
    setupNavigation();
    setupInput();
    setupModelSelector();
    setupUpload();
    setupChips();
    autoResizeTextarea(els.welcomeInput);
    autoResizeTextarea(els.chatInput);

    // Load API stats and Auth
    await checkApiStatus();
    await checkAuthSession();

    renderConversations();
    updateSidebarUser();

    // Auto-collapse sidebar on mobile devices
    if (window.innerWidth <= 768) {
        els.sidebar.classList.add('collapsed');
    }
}

// ===== API HELPERS =====
if (!localStorage.getItem('careerai_session')) {
    localStorage.setItem('careerai_session', 'session_' + Math.random().toString(36).substr(2, 9));
}
state.sessionId = localStorage.getItem('careerai_session');

async function apiGet(path) {
    const headers = { 'X-Session-ID': state.sessionId };
    if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;

    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        if (res.status === 401) handleLogout();
        throw new Error(err.detail || 'API Error');
    }
    return res.json();
}

async function apiPost(path, body, useUrlEncoded = false) {
    const headers = { 'X-Session-ID': state.sessionId };
    if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;
    if (!useUrlEncoded) headers['Content-Type'] = 'application/json';
    else headers['Content-Type'] = 'application/x-www-form-urlencoded';

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: useUrlEncoded ? body : JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        if (res.status === 401) handleLogout();
        throw new Error(err.detail || 'API Error');
    }
    return res.json();
}

async function apiDelete(path) {
    const headers = { 'X-Session-ID': state.sessionId };
    if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;

    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        if (res.status === 401) handleLogout();
        throw new Error(err.detail || 'API Error');
    }
    return res.json();
}

// ===== STATUS CHECK =====
async function checkApiStatus() {
    try {
        const status = await apiGet('/api/status');
        state.apiConfigured = status.api_configured;
        state.currentModel = status.model || state.currentModel;
        state.documents = status.documents || [];

        // Update model display name
        const modelNames = {
            'llama-3.3-70b-versatile': 'CareerAI Pro',
            'llama-3.1-8b-instant': 'CareerAI Flash',
        };
        state.currentModelDisplay = modelNames[state.currentModel] || state.currentModel;
        $$('.model-name').forEach(n => n.textContent = state.currentModelDisplay);

        // Update notification bar
        if (state.apiConfigured) {
            els.notificationBar.innerHTML = `
                <span style="color: #16a34a;">● Conectado</span>
                <span class="notification-separator">·</span>
                <span>${state.currentModelDisplay}</span>
                <span class="notification-separator">·</span>
                <span>${status.total_documents} docs · ${status.total_chunks} chunks</span>
            `;
        } else {
            els.notificationBar.innerHTML = `
                <span style="color: #dc2626;">● Sin configurar</span>
                <span class="notification-separator">·</span>
                <a href="#" class="notification-link" onclick="showApiConfig(); return false;">Configurar API Key</a>
            `;
        }

        // Update model selector active state
        $$('.model-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.model === state.currentModel);
        });

        // Render documents
        renderDocumentsFromList(state.documents);
    } catch (e) {
        console.warn('Could not check API status:', e.message);
        els.notificationBar.innerHTML = `
            <span style="color: #dc2626;">● Backend no disponible</span>
            <span class="notification-separator">·</span>
            <span>Asegúrate de ejecutar: uvicorn api:app --port 8000</span>
        `;
    }
}

// ===== API CONFIG =====
function showApiConfig() {
    // Create inline config modal
    const existing = document.getElementById('apiConfigModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'apiConfigModal';
    modal.className = 'upload-modal';
    modal.innerHTML = `
        <div class="upload-modal-backdrop" onclick="document.getElementById('apiConfigModal').remove()"></div>
        <div class="upload-modal-content" style="max-width: 480px;">
            <div class="upload-modal-header">
                <h3>🔑 Configurar API Key</h3>
                <button class="upload-close" onclick="document.getElementById('apiConfigModal').remove()">&times;</button>
            </div>
            <div class="upload-modal-body">
                <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 16px;">
                    Obtén tu API key gratis en <a href="https://console.groq.com" target="_blank" style="color: var(--accent-primary);">console.groq.com</a>
                </p>
                <div class="config-input-group">
                    <input type="password" class="config-input" id="apiKeyInput" placeholder="gsk_..." value="${state.apiKey}">
                    <button class="config-btn" onclick="saveApiConfig()">Conectar</button>
                </div>
                <div id="apiConfigStatus"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('apiKeyInput').focus();
}

window.showApiConfig = showApiConfig;

async function saveApiConfig() {
    const input = document.getElementById('apiKeyInput');
    const statusEl = document.getElementById('apiConfigStatus');
    const apiKey = input.value.trim();

    if (!apiKey) {
        statusEl.innerHTML = '<div class="config-status disconnected"><span class="status-dot"></span> Ingresa un API key</div>';
        return;
    }

    statusEl.innerHTML = '<div class="upload-processing"><div class="spinner"></div><span>Conectando...</span></div>';

    try {
        const result = await apiPost('/api/config', {
            api_key: apiKey,
            model: state.currentModel,
        });

        state.apiConfigured = true;
        state.apiKey = apiKey;
        statusEl.innerHTML = '<div class="config-status connected"><span class="status-dot"></span> ¡Conectado exitosamente!</div>';

        setTimeout(() => {
            document.getElementById('apiConfigModal')?.remove();
            checkApiStatus();
        }, 1000);
    } catch (e) {
        statusEl.innerHTML = `<div class="config-status disconnected"><span class="status-dot"></span> Error: ${e.message}</div>`;
    }
}

window.saveApiConfig = saveApiConfig;

// ===== SIDEBAR =====
function setupSidebar() {
    els.toggleSidebar.addEventListener('click', toggleSidebar);
    els.mobileSidebarToggle.addEventListener('click', () => {
        els.sidebar.classList.remove('collapsed');
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!els.sidebar.contains(e.target) && !els.mobileSidebarToggle.contains(e.target)) {
                els.sidebar.classList.add('collapsed');
            }
        }
    });

    els.newChatBtn.addEventListener('click', newChat);

    // Login & Profile logic bindings
    const userMenu = document.getElementById('userMenu');
    const loginModal = document.getElementById('loginModal');
    const loginClose = document.getElementById('loginClose');
    const loginBackdrop = document.getElementById('loginBackdrop');

    const profileModal = document.getElementById('profileModal');
    const profileClose = document.getElementById('profileClose');
    const profileBackdrop = document.getElementById('profileBackdrop');

    if (userMenu) {
        userMenu.addEventListener('click', () => {
            if (!state.currentUser) {
                loginModal.classList.remove('hidden');
            } else {
                // Open Profile Modal
                document.getElementById('profileName').value = state.currentUser.name;
                document.getElementById('profileEmail').value = state.currentUser.email;
                document.getElementById('profilePreview').src = state.currentUser.picture;
                profileModal.classList.remove('hidden');
            }
        });
    }

    if (loginClose) loginClose.addEventListener('click', () => { loginModal.classList.add('hidden'); setAuthMode('login'); });
    if (loginBackdrop) loginBackdrop.addEventListener('click', () => { loginModal.classList.add('hidden'); setAuthMode('login'); });

    if (profileClose) profileClose.addEventListener('click', () => profileModal.classList.add('hidden'));
    if (profileBackdrop) profileBackdrop.addEventListener('click', () => profileModal.classList.add('hidden'));
}

async function checkAuthSession() {
    if (state.authToken) {
        try {
            const user = await apiGet('/api/auth/me');
            state.currentUser = user;
            updateSidebarUser();

            // Sync conversations
            const cloudConvs = await apiGet('/api/conversations');
            if (cloudConvs && cloudConvs.length > 0) {
                state.conversations = cloudConvs;
                saveConversations(); // Sync strictly to local cache initially
                renderConversations();
            }
        } catch (e) {
            handleLogout();
        }
    }
}

window.handleAuthSubmit = async function (event) {
    event.preventDefault();
    const btn = document.getElementById('authSubmitBtn');

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value.trim();
    const resetCode = document.getElementById('authResetCode')?.value.trim();
    const mode = state.authMode;

    try {
        btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin:auto;"></span>';
        btn.style.pointerEvents = 'none';

        let result;
        if (mode === 'register') {
            result = await apiPost('/api/auth/register', { name, email, password });
        } else if (mode === 'login') {
            result = await apiPost('/api/auth/login', `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, true);
        } else if (mode === 'reset') {
            result = await apiPost('/api/auth/reset-password', { email, code: resetCode, new_password: password });
            showToast('✅ ' + result.message);
            setAuthMode('login');
            return;
        }

        state.authToken = result.access_token;
        localStorage.setItem('careerai_token', result.access_token);

        document.getElementById('loginModal').classList.add('hidden');
        showToast('✅ Sesión iniciada con éxito');

        await checkAuthSession();
    } catch (err) {
        showToast('❌ Error: ' + err.message);
    } finally {
        btn.innerHTML = mode === 'register' ? 'Registrarme' : (mode === 'reset' ? 'Actualizar Contraseña' : 'Iniciar Sesión');
        btn.style.pointerEvents = 'auto';
    }
};

window.setAuthMode = function (mode) {
    state.authMode = mode;

    const registerFields = document.getElementById('registerFields');
    const resetCodeFields = document.getElementById('resetCodeFields');
    const passwordFieldsGroup = document.getElementById('passwordFieldsGroup');
    const forgotPassContainer = document.getElementById('forgotPassContainer');
    const authToggleContainer = document.getElementById('authToggleContainer');
    const backToLoginContainer = document.getElementById('backToLoginContainer');
    const loginTitle = document.getElementById('loginTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authSendCodeBtn = document.getElementById('authSendCodeBtn');

    // Hide all uniquely conditional elements initially
    registerFields.style.display = 'none';
    resetCodeFields.style.display = 'none';
    passwordFieldsGroup.style.display = 'none';
    forgotPassContainer.style.display = 'none';
    authToggleContainer.style.display = 'none';
    backToLoginContainer.style.display = 'none';
    authSendCodeBtn.style.display = 'none';
    authSubmitBtn.style.display = 'flex';

    document.getElementById('authPassword').required = false;

    if (mode === 'login') {
        passwordFieldsGroup.style.display = 'block';
        forgotPassContainer.style.display = 'block';
        authToggleContainer.style.display = 'block';
        document.getElementById('authPassword').required = true;

        loginTitle.innerText = 'Acceso a CareerAI';
        authSubmitBtn.innerText = 'Iniciar Sesión';
        document.getElementById('authToggleText').innerHTML = '¿No tienes cuenta? <a href="#" onclick="event.preventDefault(); setAuthMode(\'register\')" style="color: var(--accent-primary); text-decoration: none;">Regístrate</a>';

    } else if (mode === 'register') {
        registerFields.style.display = 'block';
        passwordFieldsGroup.style.display = 'block';
        authToggleContainer.style.display = 'block';
        document.getElementById('authPassword').required = true;

        loginTitle.innerText = 'Crear cuenta';
        authSubmitBtn.innerText = 'Registrarme';
        document.getElementById('authToggleText').innerHTML = '¿Ya tienes cuenta? <a href="#" onclick="event.preventDefault(); setAuthMode(\'login\')" style="color: var(--accent-primary); text-decoration: none;">Inicia sesión</a>';

    } else if (mode === 'forgot') {
        backToLoginContainer.style.display = 'block';
        authSubmitBtn.style.display = 'none';
        authSendCodeBtn.style.display = 'flex';

        loginTitle.innerText = 'Recuperar contraseña';

    } else if (mode === 'reset') {
        resetCodeFields.style.display = 'block';
        passwordFieldsGroup.style.display = 'block';
        backToLoginContainer.style.display = 'block';
        document.getElementById('authPassword').required = true;

        loginTitle.innerText = 'Nueva contraseña';
        authSubmitBtn.innerText = 'Actualizar Contraseña';

        // Minor QOL: focus the code input directly
        setTimeout(() => document.getElementById('authResetCode')?.focus(), 100);
    }
};

window.handleSendResetCode = async function (event) {
    event.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    if (!email) {
        showToast('⚠️ Ingresa tu correo electrónico', 'warning');
        return;
    }

    const btn = document.getElementById('authSendCodeBtn');
    try {
        btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin:auto;"></span>';
        btn.style.pointerEvents = 'none';

        const result = await apiPost('/api/auth/forgot-password', { email });
        showToast('✅ ' + result.message);

        // Move to phase 2
        setAuthMode('reset');
    } catch (err) {
        showToast('❌ Error: ' + err.message);
    } finally {
        btn.innerHTML = 'Enviar código a mi correo';
        btn.style.pointerEvents = 'auto';
    }
};

window.handleProfilePictureSelect = function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // For now we set it as local base64 until submission
            document.getElementById('profilePreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

window.handleProfileSubmit = async function (event) {
    event.preventDefault();
    const btn = document.getElementById('profileSubmitBtn');
    const name = document.getElementById('profileName').value.trim();
    // In our implementation we can send base64 image or just accept name for now

    // Check if user changed picture logic
    const imgEl = document.getElementById('profilePreview');
    const pictureStr = imgEl.src.startsWith('data:image') ? imgEl.src : state.currentUser.picture;

    try {
        btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin:auto;"></span>';
        btn.style.pointerEvents = 'none';

        const result = await apiPost('/api/auth/me', { name: name, picture: pictureStr });

        state.currentUser.name = result.name;
        state.currentUser.picture = result.picture;
        updateSidebarUser();

        document.getElementById('profileModal').classList.add('hidden');
        showToast('✅ Perfil actualizado exitosamente');

    } catch (err) {
        showToast('❌ Error al actualizar perfil: ' + err.message);
    } finally {
        btn.innerHTML = 'Guardar Cambios';
        btn.style.pointerEvents = 'auto';
    }
};

function handleLogout() {
    state.currentUser = null;
    state.authToken = null;
    localStorage.removeItem('careerai_token');

    // Clear user localized states safely 
    state.conversations = [];
    state.currentConversationId = null;
    state.messages = [];
    state.documents = [];
    localStorage.removeItem('careerai_conversations');

    // Generate a new session ID for the guest
    const newSession = 'session_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('careerai_session', newSession);
    state.sessionId = newSession;

    updateSidebarUser();
    renderConversations();
    renderDocumentsFromList([]);
    showWelcome();
    document.getElementById('profileModal')?.classList.add('hidden');
    showToast('👋 Sesión cerrada');

    // Refresh status with new session
    checkApiStatus();
}

function toggleSidebar() {
    els.sidebar.classList.toggle('collapsed');
}

function updateSidebarUser() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;

    if (state.currentUser) {
        userMenu.innerHTML = `
            <img src="${state.currentUser.picture}" class="user-avatar" style="border: none; padding: 0; background: transparent;">
            <span class="user-name">${state.currentUser.name}</span>
        `;
    } else {
        userMenu.innerHTML = `
            <div class="user-avatar" style="background: var(--bg-hover); color: var(--text-secondary);">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <span class="user-name">Iniciar sesión</span>
        `;
    }
}

// ===== NAVIGATION =====
function setupNavigation() {
    $$('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            $$('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            if (page === 'chat') {
                hideDashboardPage();
                if (state.messages.length === 0) showWelcome();
                else showChat();
            } else if (page === 'documents') {
                els.uploadModal.classList.remove('hidden');
            } else if (page === 'dashboard') {
                showDashboardPage();
            } else if (page === 'settings') {
                showApiConfig();
            }

            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 768) {
                els.sidebar.classList.add('collapsed');
            }
        });
    });
}

// ===== DASHBOARD PAGE =====
function showDashboardPage() {
    els.welcomeScreen.classList.add('hidden');
    els.welcomeScreen.style.display = 'none';
    els.chatScreen.classList.add('hidden');
    els.chatScreen.style.display = 'none';

    let dashPage = document.getElementById('dashboardPage');
    if (dashPage) dashPage.remove();

    dashPage = document.createElement('div');
    dashPage.id = 'dashboardPage';
    dashPage.style.cssText = 'flex:1; overflow-y:auto; padding:40px 24px; animation: fadeIn 0.4s ease-out;';
    dashPage.innerHTML = `
        <div style="max-width:900px; margin:0 auto;">
            <h2 style="font-family: var(--font-serif); font-size:1.8rem; font-weight:400; margin-bottom:8px; color: var(--text-primary);">📊 Dashboard Profesional</h2>
            <p style="color: var(--text-secondary); font-size:0.9rem; margin-bottom:28px;">Análisis inteligente de tus documentos — perfil, skills y experiencia.</p>

            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:28px;" id="dashKpis">
                <div class="dash-kpi"><div class="dash-kpi-value" id="kpiDocs">—</div><div class="dash-kpi-label">Documentos</div></div>
                <div class="dash-kpi"><div class="dash-kpi-value" id="kpiChunks">—</div><div class="dash-kpi-label">Chunks</div></div>
                <div class="dash-kpi"><div class="dash-kpi-value" id="kpiSkills">—</div><div class="dash-kpi-label">Skills</div></div>
                <div class="dash-kpi"><div class="dash-kpi-value" id="kpiExp">—</div><div class="dash-kpi-label">Experiencias</div></div>
            </div>

            <div class="dash-card" id="dashSummaryCard" style="display:none;">
                <h3 class="dash-card-title">👤 Resumen del Perfil</h3>
                <div id="dashSummaryContent"></div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                <div class="dash-card">
                    <h3 class="dash-card-title">📊 Skills por Categoría</h3>
                    <div style="position:relative; height:280px;" id="chartCategoryWrap"><canvas id="chartCategory"></canvas></div>
                </div>
                <div class="dash-card">
                    <h3 class="dash-card-title">🎯 Skills por Nivel</h3>
                    <div style="position:relative; height:280px;" id="chartLevelWrap"><canvas id="chartLevel"></canvas></div>
                </div>
            </div>

            <div class="dash-card" id="dashSkillsCard" style="display:none;">
                <h3 class="dash-card-title">🛠️ Skills Detectadas</h3>
                <div id="dashSkillsTable"></div>
            </div>

            <div class="dash-card" id="dashTimelineCard" style="display:none;">
                <h3 class="dash-card-title">📅 Trayectoria Profesional</h3>
                <div id="dashTimeline"></div>
            </div>

            <div class="dash-card" id="dashInsightsCard" style="display:none;">
                <h3 class="dash-card-title">🧠 Insights de la IA</h3>
                <div id="dashInsights"></div>
            </div>

            <div id="dashLoading" style="text-align:center; padding:60px 0;">
                <div class="spinner" style="margin:0 auto 16px;"></div>
                <p style="color:var(--text-secondary); font-size:0.9rem;">Analizando tus documentos con IA...</p>
                <p style="color:var(--text-tertiary); font-size:0.8rem;">Esto puede tomar 10-20 segundos</p>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:20px;">
                <button onclick="document.querySelector('[data-page=documents]').click()" class="dash-action-btn">📄 Subir Documentos</button>
                <button onclick="clearAllConversations()" class="dash-action-btn">🗑️ Limpiar Historial</button>
            </div>
        </div>
    `;

    els.mainContent.appendChild(dashPage);
    addDashboardStyles();
    loadDashboardData();
}

function addDashboardStyles() {
    if (document.getElementById('dashStyles')) return;
    const s = document.createElement('style');
    s.id = 'dashStyles';
    s.textContent = `
        .dash-kpi { background:var(--bg-input); border:1px solid var(--border-light); border-radius:14px; padding:20px; text-align:center; transition:transform 0.2s,box-shadow 0.2s; }
        .dash-kpi:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,0,0,0.06); }
        .dash-kpi-value { font-size:2rem; font-weight:700; color:var(--accent-primary); line-height:1.2; }
        .dash-kpi-label { font-size:0.75rem; color:var(--text-tertiary); font-weight:600; text-transform:uppercase; letter-spacing:0.06em; margin-top:4px; }
        .dash-card { background:var(--bg-input); border:1px solid var(--border-light); border-radius:14px; padding:24px; margin-bottom:16px; }
        .dash-card-title { font-size:1rem; font-weight:600; margin-bottom:16px; color:var(--text-primary); }
        .dash-action-btn { padding:10px 20px; border:1px solid var(--border-light); border-radius:10px; background:var(--bg-input); color:var(--text-primary); font-size:0.88rem; font-weight:500; cursor:pointer; font-family:var(--font-family); transition:all 0.2s; }
        .dash-action-btn:hover { background:var(--bg-secondary); border-color:var(--accent-primary); color:var(--accent-primary); }
        .skill-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:6px; font-size:0.8rem; font-weight:500; margin:3px; }
        .skill-badge.advanced { background:#dcfce7; color:#166534; }
        .skill-badge.intermediate { background:#dbeafe; color:#1e40af; }
        .skill-badge.basic { background:#fef3c7; color:#92400e; }
        .timeline-item { position:relative; padding:16px 0 16px 28px; border-left:2px solid var(--border-light); }
        .timeline-item:before { content:''; position:absolute; left:-5px; top:20px; width:8px; height:8px; border-radius:50%; background:var(--accent-primary); border:2px solid var(--bg-primary); }
        .timeline-item.current:before { background:#16a34a; box-shadow:0 0 0 3px rgba(22,163,74,0.2); }
        .timeline-role { font-weight:600; font-size:0.95rem; }
        .timeline-company { color:var(--accent-primary); font-size:0.88rem; }
        .timeline-dates { color:var(--text-tertiary); font-size:0.8rem; margin-top:2px; }
        .timeline-desc { color:var(--text-secondary); font-size:0.84rem; margin-top:4px; }
        .insight-section { margin-bottom:16px; }
        .insight-section h4 { font-size:0.88rem; font-weight:600; margin-bottom:8px; }
        .insight-item { padding:6px 0; font-size:0.86rem; color:var(--text-secondary); border-bottom:1px solid var(--border-light); }
        .insight-item:last-child { border-bottom:none; }
        @media (max-width:768px) { #dashKpis { grid-template-columns:repeat(2,1fr) !important; } }
    `;
    document.head.appendChild(s);
}

async function loadDashboardData() {
    const loading = document.getElementById('dashLoading');
    try {
        const status = await apiGet('/api/status');
        const el = (id) => document.getElementById(id);
        if (el('kpiDocs')) el('kpiDocs').textContent = status.total_documents;
        if (el('kpiChunks')) el('kpiChunks').textContent = status.total_chunks;
    } catch (e) { /* ignore */ }

    try {
        const data = await apiGet('/api/dashboard');
        if (loading) loading.style.display = 'none';

        if (!data.has_data) {
            if (loading) {
                loading.style.display = 'block';
                loading.innerHTML = `<div style="padding:40px; text-align:center;"><p style="font-size:3rem; margin-bottom:12px;">📭</p><p style="color:var(--text-secondary); font-size:1rem; font-weight:500;">No hay datos para analizar</p><p style="color:var(--text-tertiary); font-size:0.88rem; margin-top:8px;">${data.error || 'Sube documentos o configura tu API key.'}</p><button onclick="document.querySelector('[data-page=documents]').click()" class="dash-action-btn" style="margin-top:20px;">📄 Subir mi CV</button></div>`;
            }
            return;
        }

        const el = (id) => document.getElementById(id);
        if (el('kpiSkills')) el('kpiSkills').textContent = data.total_skills || 0;
        if (el('kpiExp')) el('kpiExp').textContent = data.total_experience || 0;

        // Profile Summary
        if (data.summary && (data.summary.headline || data.summary.estimated_seniority)) {
            const sc = el('dashSummaryCard'); if (sc) sc.style.display = 'block';
            const s = data.summary;
            el('dashSummaryContent').innerHTML = `<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;"><div><div style="font-size:0.75rem; color:var(--text-tertiary); font-weight:600; text-transform:uppercase;">Headline</div><div style="font-size:0.92rem; font-weight:500; margin-top:4px;">${s.headline || '—'}</div></div><div><div style="font-size:0.75rem; color:var(--text-tertiary); font-weight:600; text-transform:uppercase;">Seniority</div><div style="font-size:0.92rem; font-weight:500; margin-top:4px; text-transform:capitalize;">${s.estimated_seniority || '—'}</div></div><div><div style="font-size:0.75rem; color:var(--text-tertiary); font-weight:600; text-transform:uppercase;">Años Experiencia</div><div style="font-size:0.92rem; font-weight:500; margin-top:4px;">${s.total_years_experience || '—'} años</div></div></div>`;
        }

        // Charts
        renderCategoryChart(data.skills_by_category || {});
        renderLevelChart(data.skills_by_level || {});

        // Skills Table
        if (data.skills && data.skills.length > 0) {
            el('dashSkillsCard').style.display = 'block';
            const grouped = {};
            data.skills.forEach(sk => { const c = sk.category || 'other'; if (!grouped[c]) grouped[c] = []; grouped[c].push(sk); });
            const catL = { technical: '💻 Técnicas', soft: '🤝 Soft Skills', tools: '🔧 Herramientas', language: '🌍 Idiomas', other: '📌 Otras' };
            let h = '';
            for (const [cat, skills] of Object.entries(grouped)) {
                h += `<div style="margin-bottom:12px;"><strong style="font-size:0.82rem; color:var(--text-tertiary);">${catL[cat] || cat}</strong><div style="margin-top:6px;">`;
                skills.forEach(sk => { h += `<span class="skill-badge ${sk.level || 'intermediate'}">${sk.name}</span>`; });
                h += '</div></div>';
            }
            el('dashSkillsTable').innerHTML = h;
        }

        // Timeline
        if (data.experience_timeline && data.experience_timeline.length > 0) {
            el('dashTimelineCard').style.display = 'block';
            el('dashTimeline').innerHTML = data.experience_timeline.map(exp => `
                <div class="timeline-item ${exp.current ? 'current' : ''}">
                    <div class="timeline-role">${exp.role}</div>
                    <div class="timeline-company">${exp.company}</div>
                    <div class="timeline-dates">${exp.start_date} → ${exp.end_date}${exp.current ? ' (Actual)' : ''}</div>
                    ${exp.description ? `<div class="timeline-desc">${exp.description}</div>` : ''}
                </div>
            `).join('');
        }

        // Insights
        if (data.insights) {
            const ins = data.insights;
            if (ins.strengths?.length || ins.potential_gaps?.length || ins.role_suggestions?.length || ins.next_actions?.length) {
                el('dashInsightsCard').style.display = 'block';
                let h = '';
                if (ins.strengths?.length) h += `<div class="insight-section"><h4>💪 Fortalezas</h4>${ins.strengths.map(s => `<div class="insight-item">✅ ${s}</div>`).join('')}</div>`;
                if (ins.potential_gaps?.length) h += `<div class="insight-section"><h4>📉 Áreas de mejora</h4>${ins.potential_gaps.map(s => `<div class="insight-item">⚠️ ${s}</div>`).join('')}</div>`;
                if (ins.role_suggestions?.length) h += `<div class="insight-section"><h4>🎯 Roles sugeridos</h4>${ins.role_suggestions.map(s => `<div class="insight-item">🏢 ${s}</div>`).join('')}</div>`;
                if (ins.next_actions?.length) h += `<div class="insight-section"><h4>🚀 Próximos pasos</h4>${ins.next_actions.map(s => `<div class="insight-item">→ ${s}</div>`).join('')}</div>`;
                el('dashInsights').innerHTML = h;
            }
        }
    } catch (e) {
        console.error('Dashboard error:', e);
        if (loading) loading.innerHTML = `<div style="padding:40px; text-align:center;"><p style="font-size:3rem; margin-bottom:12px;">⚠️</p><p style="color:var(--text-secondary);">Error al cargar el dashboard</p><p style="color:var(--text-tertiary); font-size:0.85rem; margin-top:8px;">${e.message}</p></div>`;
    }
}

function renderCategoryChart(data) {
    const canvas = document.getElementById('chartCategory');
    if (!canvas || !window.Chart) return;
    const labels = Object.keys(data), values = Object.values(data);
    if (!labels.length) { document.getElementById('chartCategoryWrap').innerHTML = '<p style="color:var(--text-tertiary); text-align:center; padding:80px 0;">Sin datos</p>'; return; }
    const catN = { technical: 'Técnicas', soft: 'Soft Skills', tools: 'Herramientas', language: 'Idiomas', other: 'Otras' };
    const catC = { technical: '#c97c3e', soft: '#6366f1', tools: '#10b981', language: '#f59e0b', other: '#8b5cf6' };
    new Chart(canvas, { type: 'bar', data: { labels: labels.map(l => catN[l] || l), datasets: [{ data: values, backgroundColor: labels.map(l => catC[l] || '#94a3b8'), borderRadius: 8, borderSkipped: false }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { ticks: { font: { size: 11 } }, grid: { display: false } } } } });
}

function renderLevelChart(data) {
    const canvas = document.getElementById('chartLevel');
    if (!canvas || !window.Chart) return;
    const labels = Object.keys(data), values = Object.values(data);
    if (values.every(v => v === 0)) { document.getElementById('chartLevelWrap').innerHTML = '<p style="color:var(--text-tertiary); text-align:center; padding:80px 0;">Sin datos</p>'; return; }
    const levelN = { basic: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' };
    new Chart(canvas, { type: 'doughnut', data: { labels: labels.map(l => levelN[l] || l), datasets: [{ data: values, backgroundColor: ['#fbbf24', '#3b82f6', '#22c55e'], borderWidth: 0, hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12 } } } } } });
}

function hideDashboardPage() {
    const dashPage = document.getElementById('dashboardPage');
    if (dashPage) dashPage.remove();
}

function clearAllConversations() {
    if (confirm('¿Estás seguro? Se borrarán todas las conversaciones guardadas.')) {
        state.conversations = [];
        state.messages = [];
        state.currentConversationId = null;
        saveConversations();
        renderConversations();
        showWelcome();
        hideDashboardPage();
        showToast('🗑️ Historial limpiado');
    }
}

window.clearAllConversations = clearAllConversations;


// ===== INPUT =====
function setupInput() {
    // Welcome input
    els.welcomeInput.addEventListener('input', () => {
        autoResizeTextarea(els.welcomeInput);
        els.sendBtn.disabled = !els.welcomeInput.value.trim();
    });

    els.welcomeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (els.welcomeInput.value.trim() && !state.isStreaming) {
                sendMessage(els.welcomeInput.value.trim());
                els.welcomeInput.value = '';
                autoResizeTextarea(els.welcomeInput);
                els.sendBtn.disabled = true;
            }
        }
    });

    els.sendBtn.addEventListener('click', () => {
        if (els.welcomeInput.value.trim() && !state.isStreaming) {
            sendMessage(els.welcomeInput.value.trim());
            els.welcomeInput.value = '';
            autoResizeTextarea(els.welcomeInput);
            els.sendBtn.disabled = true;
        }
    });

    // Chat input
    els.chatInput.addEventListener('input', () => {
        autoResizeTextarea(els.chatInput);
        els.chatSendBtn.disabled = !els.chatInput.value.trim();
    });

    els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (els.chatInput.value.trim() && !state.isStreaming) {
                sendMessage(els.chatInput.value.trim());
                els.chatInput.value = '';
                autoResizeTextarea(els.chatInput);
                els.chatSendBtn.disabled = true;
            }
        }
    });

    els.chatSendBtn.addEventListener('click', () => {
        if (els.chatInput.value.trim() && !state.isStreaming) {
            sendMessage(els.chatInput.value.trim());
            els.chatInput.value = '';
            autoResizeTextarea(els.chatInput);
            els.chatSendBtn.disabled = true;
        }
    });
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// ===== MODEL SELECTOR =====
function setupModelSelector() {
    const selectors = [els.modelSelector, els.chatModelSelector];

    selectors.forEach(sel => {
        sel.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = sel.getBoundingClientRect();
            const dropdown = els.modelDropdown;

            if (!dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                return;
            }

            dropdown.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
            dropdown.style.left = rect.left + 'px';
            dropdown.classList.remove('hidden');
        });
    });

    $$('.model-option').forEach(opt => {
        opt.addEventListener('click', async () => {
            const model = opt.dataset.model;
            const display = opt.dataset.display;

            state.currentModel = model;
            state.currentModelDisplay = display;

            $$('.model-name').forEach(n => n.textContent = display);
            $$('.model-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            els.modelDropdown.classList.add('hidden');

            // Update on backend
            if (state.apiConfigured) {
                try {
                    await fetch(`${API_BASE}/api/model?model=${model}`, { method: 'POST' });
                    showToast(`Modelo cambiado a ${display}`);
                } catch (e) {
                    showToast(`Error al cambiar modelo: ${e.message}`);
                }
            } else {
                showToast(`Modelo: ${display} (conecta API key para usar)`);
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!els.modelDropdown.contains(e.target)) {
            els.modelDropdown.classList.add('hidden');
        }
    });
}

// ===== UPLOAD =====
function setupUpload() {
    [els.attachBtn, els.chatAttachBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            els.uploadModal.classList.remove('hidden');
        });
    });

    els.uploadClose.addEventListener('click', closeUploadModal);
    els.uploadBackdrop.addEventListener('click', closeUploadModal);

    els.uploadDropzone.addEventListener('click', () => els.fileInput.click());

    els.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
    });

    els.uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.uploadDropzone.classList.add('drag-over');
    });

    els.uploadDropzone.addEventListener('dragleave', () => {
        els.uploadDropzone.classList.remove('drag-over');
    });

    els.uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        els.uploadDropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
    });

    $$('.upload-type').forEach(type => {
        type.addEventListener('click', () => {
            $$('.upload-type').forEach(t => t.classList.remove('active'));
            type.classList.add('active');
            state.selectedDocType = type.dataset.type;
        });
    });
}

function closeUploadModal() {
    els.uploadModal.classList.add('hidden');
}

async function handleFileUpload(file) {
    const validExts = ['pdf', 'txt', 'docx', 'jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!validExts.includes(ext)) {
        showToast('❌ Formato no soportado');
        return;
    }

    const dropzone = els.uploadDropzone;
    const originalContent = dropzone.innerHTML;

    dropzone.innerHTML = `
        <div class="upload-processing">
            <div class="spinner"></div>
            <span>Procesando ${file.name}...</span>
        </div>
    `;

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_type', state.selectedDocType);

        const headers = { 'X-Session-ID': state.sessionId };
        if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;

        const res = await fetch(`${API_BASE}/api/documents/upload`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(err.detail);
        }

        const result = await res.json();

        dropzone.innerHTML = `
        <div class="upload-success">
            ✅ <strong>${file.name}</strong> — ${result.message}
        </div>
    `;

        // Refresh documents list
        await refreshDocuments();

        setTimeout(() => {
            dropzone.innerHTML = originalContent;
            closeUploadModal();
            showToast(`📄 ${file.name} indexado correctamente`);
        }, 1800);

    } catch (e) {
        dropzone.innerHTML = `
        <div style="color: #dc2626; padding: 16px; text-align: center;">
            ❌ Error: ${e.message}
        </div>
    `;
        setTimeout(() => {
            dropzone.innerHTML = originalContent;
        }, 3000);
    }

    els.fileInput.value = '';
}

async function refreshDocuments() {
    try {
        const data = await apiGet('/api/documents');
        state.documents = data.documents || [];
        renderDocumentsFromList(state.documents);
        checkApiStatus(); // Also refresh status bar
    } catch (e) {
        console.warn('Could not refresh documents:', e);
    }
}

function renderDocumentsFromList(docs) {
    if (!docs || docs.length === 0) {
        els.documentList.innerHTML = `
        <div class="empty-docs">
            <span class="empty-docs-icon">📭</span>
            <span>Sin documentos aún</span>
        </div>
    `;
        return;
    }

    const docIcons = { cv: '📋', job_offer: '💼', linkedin: '👤', other: '📄' };

    els.documentList.innerHTML = docs.map(doc => {
        const icon = '📄'; // Simple icon for filenames from backend
        return `
        <div class="doc-item">
            <span class="doc-icon">${icon}</span>
            <span class="doc-name">${doc}</span>
            <button class="doc-remove" onclick="removeDocument('${doc}')" title="Eliminar">🗑️</button>
        </div>
    `;
    }).join('');
}

async function removeDocument(filename) {
    try {
        await apiDelete(`/api/documents/${encodeURIComponent(filename)}`);
        showToast(`🗑️ ${filename} eliminado`);
        await refreshDocuments();
    } catch (e) {
        showToast(`❌ Error: ${e.message} `);
    }
}

window.removeDocument = removeDocument;

// ===== CHIPS =====
function setupChips() {
    $$('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.dataset.query;
            if (query && !state.isStreaming) sendMessage(query);
        });
    });
}

// ===== MESSAGES =====
async function sendMessage(text) {
    if (state.isStreaming) return;

    // API is pre-configured, no need to check

    // Create conversation if needed
    if (!state.currentConversationId) {
        state.currentConversationId = Date.now().toString();
        state.conversations.unshift({
            id: state.currentConversationId,
            title: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
            date: new Date().toISOString(),
            messages: [],
        });
        saveConversations();
        renderConversations();
    }

    // Add user message
    const userMsg = { role: 'user', content: text };
    state.messages.push(userMsg);

    showChat();
    renderMessages();
    scrollToBottom();

    // Show typing indicator
    showTypingIndicator();
    state.isStreaming = true;

    try {
        const headers = {
            'Content-Type': 'application/json',
            'X-Session-ID': state.sessionId
        };
        if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;

        // Call streaming API
        const response = await fetch(`${API_BASE}/api/chat/stream`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: text,
                chat_history: state.messages.slice(0, -1), // Exclude last message (the current query)
                mode: 'auto',
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Error de comunicación' }));
            throw new Error(err.detail);
        }

        // Parse SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let detectedMode = 'general';

        hideTypingIndicator();

        // Add placeholder AI message
        const aiMsg = { role: 'assistant', content: '' };
        state.messages.push(aiMsg);
        renderMessages();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));

                        if (data.type === 'mode') {
                            detectedMode = data.mode;
                        } else if (data.type === 'token') {
                            fullResponse += data.content;
                            aiMsg.content = fullResponse;
                            updateLastMessage(fullResponse);
                            scrollToBottom();
                        } else if (data.type === 'done') {
                            // Streaming complete
                        } else if (data.type === 'error') {
                            throw new Error(data.error);
                        }
                    } catch (parseError) {
                        // Skip malformed SSE lines
                        if (parseError.message !== 'Unexpected end of JSON input') {
                            console.warn('SSE parse error:', parseError);
                        }
                    }
                }
            }
        }

        // Final render with full markdown
        aiMsg.content = fullResponse;
        renderMessages();
        scrollToBottom();

        // Save to conversation
        saveCurrentConversation();

    } catch (e) {
        hideTypingIndicator();
        const errorMsg = { role: 'assistant', content: `❌ **Error:** ${e.message}\n\nVerifica tu API key y conexión.` };
        state.messages.push(errorMsg);
        renderMessages();
        scrollToBottom();
    } finally {
        state.isStreaming = false;
    }
}

function updateLastMessage(content) {
    const messages = els.chatMessages.querySelectorAll('.message.ai');
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
        const contentEl = lastMsg.querySelector('.message-content');
        if (contentEl) {
            contentEl.innerHTML = formatMarkdown(content) + '<span class="cursor-blink">▌</span>';
        }
    }
}

function renderMessages() {
    els.chatMessages.innerHTML = state.messages.map((msg, i) => {
        if (msg.role === 'user') {
            const hasPic = state.currentUser && state.currentUser.picture;
            const avatarContent = hasPic
                ? `<img src="${state.currentUser.picture}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`
                : `🧑‍💻`;

            const avatarStyle = hasPic
                ? 'padding:0; overflow:hidden; background:transparent; border:none; border-radius:50%;'
                : 'padding:0; overflow:hidden;';

            return `
        <div class="message user" data-index="${i}">
            <div class="message-inner">
                <div class="message-avatar user" style="${avatarStyle}">${avatarContent}</div>
                <div class="message-body">
                    <div class="message-author">${state.currentUser?.name || 'Tú'}</div>
                    <div class="message-content">${escapeHtml(msg.content)}</div>
                </div>
            </div>
        </div>
    `;
        } else {
            const modelIcon = state.currentModel === 'llama-3.1-8b-instant' ? '/static/icon-flash.png' : '/static/icon-pro.png';
            const modelLabel = state.currentModel === 'llama-3.1-8b-instant' ? 'CareerAI Flash' : 'CareerAI Pro';
            return `
        <div class="message ai" data-index="${i}">
            <div class="message-inner">
                <div class="message-avatar ai" style="background:transparent; border:none; padding:0;">
                    <img src="${modelIcon}" alt="${modelLabel}" style="width:24px;height:24px;max-width:24px;max-height:24px;object-fit:contain;">
                </div>
                <div class="message-body">
                    <div class="message-author">${modelLabel}</div>
                    <div class="message-content">${formatMarkdown(msg.content)}</div>
                    <div class="message-actions">
                        <button class="action-btn" onclick="copyMessage(${i})" title="Copiar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        </button>
                        <button class="action-btn" onclick="exportMessage(${i}, 'pdf')" title="Descargar PDF">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </button>
                        <button class="action-btn" onclick="likeMessage(${i})" title="Me gusta">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                        </button>
                        <button class="action-btn" onclick="dislikeMessage(${i})" title="No me gusta">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
        }
    }).join('');
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message ai';
    const modelIcon = state.currentModel === 'llama-3.1-8b-instant' ? '/static/icon-flash.png' : '/static/icon-pro.png';
    const modelLabel = state.currentModel === 'llama-3.1-8b-instant' ? 'CareerAI Flash' : 'CareerAI Pro';
    indicator.innerHTML = `
        <div class="message-inner">
            <div class="message-avatar ai" style="background:transparent; border:none; padding:0;">
                <img src="${modelIcon}" alt="${modelLabel}" style="width:24px;height:24px;max-width:24px;max-height:24px;object-fit:contain;">
            </div>
            <div class="message-body">
                <div class="message-author">${modelLabel}</div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    els.chatMessages.appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    });
}

// ===== MESSAGE ACTIONS =====
function copyMessage(index) {
    const msg = state.messages[index];
    if (msg) {
        navigator.clipboard.writeText(msg.content).then(() => {
            showToast('✅ Copiado al portapapeles');
        });
    }
}

async function exportMessage(index, format) {
    const msg = state.messages[index];
    if (!msg) return;

    showToast(`📄 Exportando ${format.toUpperCase()}...`);

    try {
        const res = await fetch(`${API_BASE}/api/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: msg.content, format }),
        });

        if (!res.ok) throw new Error('Export failed');

        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
        const filename = filenameMatch ? filenameMatch[1] : `CareerAI_Export.${format} `;

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        showToast(`✅ ${filename} descargado`);
    } catch (e) {
        showToast(`❌ Error al exportar: ${e.message} `);
    }
}

function likeMessage(index) {
    showToast('👍 ¡Gracias por tu feedback!');
}

function dislikeMessage(index) {
    showToast('👎 Feedback registrado');
}

window.copyMessage = copyMessage;
window.exportMessage = exportMessage;
window.likeMessage = likeMessage;
window.dislikeMessage = dislikeMessage;

// ===== CONVERSATIONS (Backend & Local fallback) =====
async function saveConversations() {
    // Save to local storage as fallback
    localStorage.setItem('careerai_conversations', JSON.stringify(state.conversations.slice(0, 50)));
}

async function saveCurrentConversation() {
    if (!state.currentConversationId) return;
    const convIndex = state.conversations.findIndex(c => c.id === state.currentConversationId);

    if (convIndex !== -1) {
        state.conversations[convIndex].messages = [...state.messages];
        state.conversations[convIndex].date = new Date().toISOString();
        saveConversations();

        // Save to backend if logged in
        if (state.authToken) {
            try {
                await apiPost('/api/conversations', {
                    id: state.currentConversationId,
                    title: state.conversations[convIndex].title,
                    messages: state.messages
                });
            } catch (e) {
                console.error("Failed to save to cloud:", e);
            }
        }
    }
}

function renderConversations() {
    if (state.conversations.length === 0) {
        els.conversationList.innerHTML = '<div class="empty-docs"><span>Sin conversaciones</span></div>';
        return;
    }

    els.conversationList.innerHTML = state.conversations.slice(0, 20).map(conv => `
        <div class="conversation-item ${conv.id === state.currentConversationId ? 'active' : ''}"
        onclick="loadConversation('${conv.id}')"
        data-id="${conv.id}">
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHtml(conv.title)}
            </span>
            <button class="conversation-delete" onclick="deleteConversation(event, '${conv.id}')" title="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `).join('');
}

function loadConversation(id) {
    const conv = state.conversations.find(c => c.id === id);
    if (conv) {
        state.currentConversationId = id;
        state.messages = conv.messages || [];
        renderConversations();
        if (state.messages.length > 0) {
            showChat();
            renderMessages();
            scrollToBottom();
        } else {
            showWelcome();
        }
    }
}

window.loadConversation = loadConversation;

function newChat() {
    state.messages = [];
    state.currentConversationId = null;
    showWelcome();
    renderConversations();
}

async function deleteConversation(event, id) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta conversación?')) {
        state.conversations = state.conversations.filter(c => c.id !== id);
        if (state.currentConversationId === id) {
            state.currentConversationId = null;
            state.messages = [];
            showWelcome();
        }
        saveConversations();
        renderConversations();

        // Delete from backend if logged in
        if (state.authToken) {
            try {
                await apiDelete(`/api/conversations/${id}`);
            } catch (e) {
                console.error("Failed to delete from cloud:", e);
            }
        }

        showToast('🗑️ Conversación eliminada');
    }
}
window.deleteConversation = deleteConversation;

// ===== VIEW TOGGLE =====
function showWelcome() {
    hideDashboardPage();
    els.welcomeScreen.classList.remove('hidden');
    els.welcomeScreen.style.display = '';
    els.chatScreen.classList.add('hidden');
    els.chatScreen.style.display = 'none';
    els.welcomeInput.focus();
}

function showChat() {
    hideDashboardPage();
    els.welcomeScreen.classList.add('hidden');
    els.welcomeScreen.style.display = 'none';
    els.chatScreen.classList.remove('hidden');
    els.chatScreen.style.display = '';
    els.chatInput.focus();
}

// ===== UTILITIES =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMarkdown(text) {
    let html = escapeHtml(text);

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');

    // Tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const result = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHtml = '<table>';
            }
            if (line.match(/^\|[\s\-|]+\|$/)) continue;

            const cells = line.split('|').filter(c => c.trim());
            const isHeader = i < lines.length - 1 && lines[i + 1] && lines[i + 1].trim().match(/^\|[\s\-|]+\|$/);
            const tag = isHeader ? 'th' : 'td';
            tableHtml += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += '</table>';
                result.push(tableHtml);
                tableHtml = '';
            }
            result.push(line);
        }
    }
    if (inTable) {
        tableHtml += '</table>';
        result.push(tableHtml);
    }

    html = result.join('\n');

    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Paragraphs
    html = html.replace(/^(?!<[hupoltb]|<\/|<li|<bl|<hr|$)(.+)$/gm, '<p>$1</p>');

    // Clean up
    html = html.replace(/\n{2,}/g, '');
    html = html.replace(/\n/g, '');

    return html;
}

// ===== TOAST =====
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        els.searchInput.focus();
    }

    if (e.key === 'Escape') {
        els.modelDropdown.classList.add('hidden');
        closeUploadModal();
        document.getElementById('apiConfigModal')?.remove();
    }
});

// ===== CSS for cursor blink =====
const style = document.createElement('style');
style.textContent = `
    .cursor-blink {
        animation: cursorBlink 1s step-end infinite;
        color: var(--accent-primary);
        font-weight: 300;
    }
    @keyframes cursorBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
    }
`;
document.head.appendChild(style);

// ===== JOBS PANEL =====

// Custom dropdown helpers
window.toggleJobsDropdown = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isOpen = el.classList.contains('open');
    // Close all first
    document.querySelectorAll('.jobs-custom-select.open').forEach(d => d.classList.remove('open'));
    if (!isOpen) el.classList.add('open');
};

window.selectJobsOption = function (dropdownId, selectId, value, label) {
    // Update hidden select value
    const sel = document.getElementById(selectId);
    if (sel) sel.value = value;
    // Update visible label
    const labelEl = document.getElementById(dropdownId + 'Label');
    if (labelEl) labelEl.textContent = label;
    // Mark active option
    const menu = document.getElementById(dropdownId + 'Menu');
    if (menu) {
        menu.querySelectorAll('.jobs-select-option').forEach(o => o.classList.remove('active'));
        event?.target?.classList.add('active');
    }
    // Close
    document.getElementById(dropdownId)?.classList.remove('open');
};

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.jobs-custom-select')) {
        document.querySelectorAll('.jobs-custom-select.open').forEach(d => d.classList.remove('open'));
    }
});
window.openJobsPanel = function () {
    const panel = document.getElementById('jobsPanel');
    const overlay = document.getElementById('jobsPanelOverlay');
    if (!panel) return;
    panel.style.display = 'flex';
    overlay.style.display = 'block';
    // Slide in animation
    panel.style.transform = 'translateX(100%)';
    panel.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
    requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; });

    // Bind Enter on search input
    const inp = document.getElementById('jobsSearchInput');
    if (inp && !inp._jobsBound) {
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadJobs(); });
        inp._jobsBound = true;
    }
};

window.closeJobsPanel = function () {
    const panel = document.getElementById('jobsPanel');
    const overlay = document.getElementById('jobsPanelOverlay');
    if (!panel) return;
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => {
        panel.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
};

window.autoFillJobSearch = async function () {
    // Try to pull CV text from the RAG document list
    const docs = state.documents;
    if (!docs || docs.length === 0) {
        showToast('⚠️ Primero sube tu CV en el panel de Documentos', 'warning');
        return;
    }
    // Use the first loaded document name as a query hint
    // Then ask the AI to extract job title keywords
    showToast('🤖 Extrayendo perfil del CV...', 'info');
    try {
        const res = await apiPost('/api/chat', {
            query: 'Basándote en mi CV, responde SOLO con el título de puesto más específico y relevante para buscar empleo, en máximo 4 palabras. Por ejemplo: "Desarrollador Full Stack" o "Diseñador UX Senior". Sin explicaciones, sin puntos, sin listas. Solo el título.',
            chat_history: [],
            mode: 'general'
        });
        const keywords = res.response?.trim().replace(/\n/g, ' ').replace(/["'*]/g, '').slice(0, 60) || '';
        if (keywords) {
            document.getElementById('jobsSearchInput').value = keywords;
            showToast('✅ Puesto detectado: ' + keywords);
            loadJobs();
        }
    } catch (e) {
        showToast('❌ No se pudo extraer el perfil: ' + e.message);
    }
};

window.loadJobs = async function () {
    const query = document.getElementById('jobsSearchInput').value.trim();
    if (!query) {
        showToast('⚠️ Escribe qué empleo quieres buscar', 'warning');
        return;
    }

    const country = document.getElementById('jobsCountry').value;
    const datePosted = document.getElementById('jobsDatePosted').value;
    const remoteOnly = document.getElementById('jobsRemoteOnly').checked;

    const btn = document.getElementById('jobsSearchBtn');
    const resultsEl = document.getElementById('jobsResults');
    const footerEl = document.getElementById('jobsFooter');

    // Show skeletons
    btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;margin:auto;"></span>';
    btn.style.pointerEvents = 'none';
    resultsEl.innerHTML = Array(5).fill(`
        <div style="border:1px solid var(--border-medium); border-radius:12px; padding:16px; animation: pulse 1.5s ease-in-out infinite; background:var(--bg-hover);">
            <div style="height:14px; background:var(--border-medium); border-radius:6px; width:60%; margin-bottom:10px;"></div>
            <div style="height:11px; background:var(--border-medium); border-radius:6px; width:40%; margin-bottom:8px;"></div>
            <div style="height:11px; background:var(--border-medium); border-radius:6px; width:80%;"></div>
        </div>
    `).join('');
    footerEl.style.display = 'none';

    try {
        let url = `/api/jobs?query=${encodeURIComponent(query)}&date_posted=${datePosted}&num_pages=1`;
        if (country) url += `&country=${country}`;
        if (remoteOnly) url += `&remote_only=true`;

        const data = await apiGet(url);
        const jobs = data.jobs || [];

        if (jobs.length === 0) {
            resultsEl.innerHTML = `
                <div style="text-align:center; padding:50px 20px; color:var(--text-tertiary);">
                    <div style="font-size:2.5rem; margin-bottom:12px;">😔</div>
                    <p style="font-weight:600; color:var(--text-secondary);">Sin resultados</p>
                    <p style="font-size:0.85rem;">Prueba con otros términos o cambia los filtros.</p>
                </div>`;
        } else {
            resultsEl.innerHTML = jobs.map(j => renderJobCard(j)).join('');
            footerEl.style.display = 'block';
            footerEl.textContent = `Mostrando ${jobs.length} ofertas · LinkedIn · Indeed · Glassdoor · más`;
        }
    } catch (err) {
        resultsEl.innerHTML = `<div style="text-align:center; padding:40px; color:#ef4444;">❌ Error: ${err.message}</div>`;
    } finally {
        btn.innerHTML = 'Buscar';
        btn.style.pointerEvents = 'auto';
    }
};

function renderJobCard(j) {
    const remoteTag = j.is_remote
        ? `<span style="background:rgba(16,185,129,0.15); color:#10b981; font-size:0.72rem; padding:2px 8px; border-radius:20px; font-weight:600;">🏠 Remoto</span>`
        : '';
    const typeTag = j.employment_type
        ? `<span style="background:var(--bg-hover); color:var(--text-secondary); font-size:0.72rem; padding:2px 8px; border-radius:20px; border:1px solid var(--border-medium);">${j.employment_type}</span>`
        : '';
    const salaryTag = j.salary
        ? `<div style="font-size:0.8rem; color:#10b981; font-weight:600; margin-top:6px;">💰 ${j.salary}</div>`
        : '';
    const posted = j.posted_at ? new Date(j.posted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '';
    const logo = j.company_logo
        ? `<img src="${j.company_logo}" style="width:36px;height:36px;object-fit:contain;border-radius:6px;background:white;padding:2px;" onerror="this.style.display='none'">`
        : `<div style="width:36px;height:36px;border-radius:6px;background:var(--bg-hover);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🏢</div>`;

    return `
    <div style="border:1px solid var(--border-medium); border-radius:12px; padding:16px; background:var(--bg-primary); transition:border-color 0.2s, box-shadow 0.2s;" 
         onmouseover="this.style.borderColor='var(--accent-primary)';this.style.boxShadow='0 2px 16px rgba(139,92,246,0.12)'"
         onmouseout="this.style.borderColor='var(--border-medium)';this.style.boxShadow='none'">
        <div style="display:flex; gap:12px; align-items:flex-start;">
            ${logo}
            <div style="flex:1; min-width:0;">
                <div style="font-size:0.95rem; font-weight:700; color:var(--text-primary); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${j.title}</div>
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:6px;">${j.company} · ${j.location || 'Sin ubicación'}</div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin-bottom:8px;">
                    ${remoteTag}${typeTag}
                    ${posted ? `<span style="font-size:0.72rem; color:var(--text-tertiary); margin-left:auto;">${posted}</span>` : ''}
                </div>
                ${j.description_snippet ? `<p style="font-size:0.8rem; color:var(--text-tertiary); margin:0 0 8px; line-height:1.5; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${j.description_snippet}</p>` : ''}
                ${salaryTag}
            </div>
        </div>
        <div style="margin-top:12px; text-align:right;">
            <a href="${j.apply_link}" target="_blank" rel="noopener" 
               style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-primary); color:white; font-size:0.82rem; font-weight:600; padding:7px 16px; border-radius:8px; text-decoration:none; transition:opacity 0.2s;"
               onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                Aplicar
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
        </div>
    </div>`;
}

