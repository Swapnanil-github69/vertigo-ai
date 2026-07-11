// Settings and Session Management view controllers
async function loadSettingsView() {
    document.getElementById('settings-name').value = state.user.name || '';
    document.getElementById('settings-email').value = state.user.email || '';
    
    // Bind Google Connected status
    const conn = document.getElementById('settings-google-connection');
    if (conn) {
        if (state.user.provider === 'google') {
            conn.innerHTML = `
                <span class="text-white font-bold flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google Workspace</span>
                <span class="text-[9px] font-label-sm px-2 py-0.5 bg-secondary/15 text-secondary border border-secondary/30 rounded">CONNECTED</span>
            `;
            conn.onclick = null;
            conn.className = "flex items-center justify-between bg-primary-container border border-white/10 rounded-lg px-4 py-3";
        } else {
            conn.innerHTML = `
                <span class="text-on-surface-variant flex items-center gap-1.5">Connect Google Account</span>
                <span class="text-[9px] font-label-sm px-2 py-0.5 bg-white/10 border border-white/10 rounded">CONNECT</span>
            `;
            conn.onclick = triggerGoogleLogin;
            conn.className = "flex items-center justify-between bg-primary-container border border-white/10 rounded-lg px-4 py-3 cursor-pointer hover:bg-white/5";
        }
    }

    // Bind current theme preference selector
    const storedTheme = localStorage.getItem('theme') || 'dark';
    const themeSelect = document.getElementById('settings-theme-select');
    if (themeSelect) {
        themeSelect.value = storedTheme;
    }

    // Load active sessions
    await loadActiveSessions();

    // Load API Keys
    const list = document.getElementById('settings-keys-list');
    if (list) {
        list.innerHTML = '';
        if (state.user.apiKeys && state.user.apiKeys.length > 0) {
            state.user.apiKeys.forEach(key => {
                list.innerHTML += `
                    <div class="flex justify-between items-center bg-primary-container/40 p-3 rounded-lg border border-white/5">
                        <div>
                            <p class="font-bold text-white font-label-md">${key.value}</p>
                            <p class="text-[9px] text-on-surface-variant mt-0.5">Created: ${key.created} | Status: ${key.status}</p>
                        </div>
                        <button onclick="revokeApiKey(${key.id})" class="p-1 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-error transition-colors" title="Revoke Key">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                `;
            });
        }
    }

    // Handle tab routing (auto-scroll)
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const tab = urlParams.get('tab');
    if (tab === 'security') {
        const securitySec = document.getElementById('settings-security-section');
        if (securitySec) {
            setTimeout(() => securitySec.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
        }
    } else if (tab === 'sessions') {
        const sessionsSec = document.getElementById('settings-sessions-section');
        if (sessionsSec) {
            setTimeout(() => sessionsSec.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
        }
    }
}

async function loadActiveSessions() {
    const sessionsList = document.getElementById('settings-sessions-list');
    if (!sessionsList) return;

    try {
        const res = await apiFetch('/api/profile/sessions');
        sessionsList.innerHTML = '';

        if (res.data && res.data.length > 0) {
            res.data.forEach(sess => {
                const badge = sess.isCurrent 
                    ? `<span class="text-[8px] font-bold px-1.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/35 rounded tracking-wide uppercase">Current Session</span>` 
                    : `<button onclick="terminateSession('${sess.id}')" class="text-[9px] text-on-surface-variant hover:text-error font-bold uppercase hover:underline">Revoke</button>`;

                sessionsList.innerHTML += `
                    <div class="flex justify-between items-center bg-primary-container/30 p-3.5 rounded-lg border border-white/5 font-sans">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-on-surface-variant text-lg">
                                ${sess.device === 'Mobile' ? 'smartphone' : 'desktop_windows'}
                            </span>
                            <div>
                                <p class="font-bold text-white text-[11px]">${sess.os} (${sess.browser})</p>
                                <p class="text-[9px] text-on-surface-variant mt-0.5">IP Vector: ${sess.ipAddress} | Created: ${new Date(sess.createdAt).toLocaleString()} | Provider: ${sess.provider === 'google' ? 'Google' : 'Credentials'}</p>
                            </div>
                        </div>
                        <div>
                            ${badge}
                        </div>
                    </div>
                `;
            });
        } else {
            sessionsList.innerHTML = `<p class="text-on-surface-variant text-[10px] italic">No active vectors parsed.</p>`;
        }
    } catch (err) {
        sessionsList.innerHTML = `<p class="text-error text-[10px]">Failed to parse active sessions.</p>`;
    }
}

async function terminateSession(sessionId) {
    try {
        await apiFetch('/api/profile/sessions/logout', {
            method: 'POST',
            body: { sessionId }
        });
        showToast("Session Terminated", "Individual token authorization revoked.", "info");
        await loadActiveSessions();
    } catch (err) {
        showToast("Action Refused", err.message || "Failed to terminate session.", "error");
    }
}

async function terminateAllOtherSessions() {
    try {
        await apiFetch('/api/profile/sessions/logout-all', {
            method: 'POST'
        });
        showToast("Sessions Cleared", "All other active terminal vectors deactivated.", "success");
        await loadActiveSessions();
    } catch (err) {
        showToast("Action Refused", err.message || "Failed to clear other sessions.", "error");
    }
}

// Complete UI Theme system controller
function toggleThemeMode(theme) {
    localStorage.setItem('theme', theme);
    applyThemeMode(theme);
    
    // Sync to backend preferences if logged in
    if (state.loggedIn) {
        apiFetch('/api/users/preferences', {
            method: 'POST',
            body: { theme: theme === 'system' ? 'dark' : theme } // fallback db theme
        }).catch(err => console.error("Failed to sync theme preference:", err));
    }
}

function applyThemeMode(theme) {
    const htmlEl = document.documentElement;
    if (theme === 'light') {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
    } else if (theme === 'dark') {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
    } else {
        // System preference matching
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
            htmlEl.classList.add('dark');
            htmlEl.classList.remove('light');
        } else {
            htmlEl.classList.add('light');
            htmlEl.classList.remove('dark');
        }
    }
}

// Initial theme apply instantly on execution start
(function initTheme() {
    const initialTheme = localStorage.getItem('theme') || 'dark';
    applyThemeMode(initialTheme);
})();

async function handleSaveProfile(e) {
    e.preventDefault();
    const name = document.getElementById('settings-name').value;

    try {
        const res = await apiFetch('/api/profile', {
            method: 'PUT',
            body: { name }
        });

        if (res.success) {
            syncGlobalUserState(res.data);
            showToast("Profile Updated", "Global identity coordinates saved.", "success");
        }
    } catch (err) {
        showToast("Update Failed", err.message || "Failed to update profile values.", "error");
    }
}

function generateApiKey() {
    const randomHex = Array.from({length: 12}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const value = `vt_live_${randomHex}`;
    const created = new Date().toISOString().substring(0, 10);
    
    if (!state.user.apiKeys) state.user.apiKeys = [];
    state.user.apiKeys.push({
        id: Date.now(),
        value,
        created,
        status: "Active"
    });
    
    showToast("Security Key Issued", "API Vector key issued.", "success");
    loadSettingsView();
}

function revokeApiKey(id) {
    if (state.user.apiKeys) {
        state.user.apiKeys = state.user.apiKeys.filter(k => k.id !== id);
    }
    showToast("Security Key Revoked", "API clearance key invalidated.", "info");
    loadSettingsView();
}

// Cascading User Account Deletion Trigger
async function deleteUserAccount() {
    const confirm = window.confirm("WARNING: Proceeding will permanently purge your database vectors, session histories, and authentication credentials. This action is irreversible. Proceed?");
    if (!confirm) return;

    try {
        const res = await apiFetch('/api/profile/delete-account', { method: 'DELETE' });
        if (res.success) {
            showToast("Clearance Wiped", "Account successfully purged from system core.", "info");
            accessToken = null;
            localStorage.removeItem('accessToken');
            state.loggedIn = false;
            window.location.hash = '#/';
        }
    } catch (err) {
        showToast("Purge Refused", err.message || "Failed to delete account.", "error");
    }
}
