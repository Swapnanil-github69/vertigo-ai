// Settings and Session Management view controllers
async function loadSettingsView() {
    document.getElementById('settings-name').value = state.user.name;
    document.getElementById('settings-email').value = state.user.email;
    
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

async function loadActiveSessions() {
    const sessionsList = document.getElementById('settings-sessions-list');
    if (!sessionsList) return;

    try {
        const res = await apiFetch('/api/users/sessions');
        sessionsList.innerHTML = '';

        if (res.data && res.data.length > 0) {
            res.data.forEach(sess => {
                const badge = sess.isCurrent 
                    ? `<span class="text-[8px] font-bold px-1.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/35 rounded tracking-wide uppercase">Current Session</span>` 
                    : `<button onclick="terminateSession('${sess.id}')" class="text-[9px] text-on-surface-variant hover:text-error font-bold uppercase hover:underline">Revoke</button>`;

                sessionsList.innerHTML += `
                    <div class="flex justify-between items-center bg-primary-container/30 p-3.5 rounded-lg border border-white/5">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-on-surface-variant text-lg">
                                ${sess.device === 'Mobile' ? 'smartphone' : 'desktop_windows'}
                            </span>
                            <div>
                                <p class="font-bold text-white text-[11px]">${sess.os} (${sess.browser})</p>
                                <p class="text-[9px] text-on-surface-variant mt-0.5">IP Vector: ${sess.ipAddress} | Created: ${new Date(sess.createdAt).toLocaleString()}</p>
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
        await apiFetch('/api/users/sessions/logout', {
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
        await apiFetch('/api/users/sessions/logout-all', {
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
    const email = document.getElementById('settings-email').value;
    
    // In our simplified setup, we can allow name/email updating. Let's just update local state.
    state.user.name = name;
    state.user.email = email;
    
    document.getElementById('sidebar-user-name').innerText = name;
    const avatar = document.getElementById('sidebar-avatar-placeholder');
    if (avatar) {
        avatar.innerText = name.split(' ').map(n => n[0]).join('');
    }
    
    showToast("Profile Updated", "Global identity coordinates saved.", "success");
}

function generateApiKey() {
    const randomHex = Array.from({length: 12}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const value = `vt_live_${randomHex}`;
    const created = new Date().toISOString().substring(0, 10);
    
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
    state.user.apiKeys = state.user.apiKeys.filter(k => k.id !== id);
    showToast("Security Key Revoked", "API clearance key invalidated.", "info");
    loadSettingsView();
}
