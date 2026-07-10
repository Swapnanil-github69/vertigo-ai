// Settings view controllers
function loadSettingsView() {
    document.getElementById('settings-name').value = state.user.name;
    document.getElementById('settings-email').value = state.user.email;
    
    const list = document.getElementById('settings-keys-list');
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

function handleSaveProfile(e) {
    e.preventDefault();
    const name = document.getElementById('settings-name').value;
    const email = document.getElementById('settings-email').value;
    
    state.user.name = name;
    state.user.email = email;
    
    document.getElementById('sidebar-user-name').innerText = name;
    document.getElementById('sidebar-avatar-placeholder').innerText = name.split(' ').map(n => n[0]).join('');
    
    showToast("Profile Updated", "Global identity coordinates saved.", "success");
    auditLog("Profile Settings", `Updated name to ${name} and email to ${email}`, "User");
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
    auditLog("Security Key Issue", "Generated new API clearance key", "System");
    loadSettingsView();
}

function revokeApiKey(id) {
    state.user.apiKeys = state.user.apiKeys.filter(k => k.id !== id);
    showToast("Security Key Revoked", "API clearance key invalidated.", "info");
    auditLog("Security Key Revoked", "Revoked credentials API key", "System");
    loadSettingsView();
}
