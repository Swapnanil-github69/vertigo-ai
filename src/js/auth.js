// Authentication Hub controllers
function showAuthTab(tab) {
    document.getElementById('auth-login-pane').classList.add('hidden');
    document.getElementById('auth-signup-pane').classList.add('hidden');
    document.getElementById('auth-forgot-pane').classList.add('hidden');
    
    document.getElementById(`auth-${tab}-pane`).classList.remove('hidden');
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    
    // Set session state
    state.loggedIn = true;
    state.user.name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());
    state.user.email = email;
    
    // Update UI coordinates
    document.getElementById('sidebar-user-name').innerText = state.user.name;
    document.getElementById('sidebar-user-name').title = state.user.name;
    document.getElementById('sidebar-avatar-placeholder').innerText = state.user.name.split(' ').map(n => n[0]).join('');
    document.getElementById('dashboard-welcome-msg').innerText = `Welcome back, ${state.user.name.split(' ')[0]}. Your risk vectors are stabilized.`;
    document.getElementById('settings-name').value = state.user.name;
    document.getElementById('settings-email').value = state.user.email;
    
    auditLog("User Login", `Authenticated session for ${email} - IP: 192.168.1.108`, "System");
    showToast("Credentials Verified", `Welcome back to Vertigo Terminal, ${state.user.name.split(' ')[0]}.`);
    
    window.location.hash = '#/dashboard';
}

function handleSignupSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    
    showToast("Clearance Created", "Initializing sandbox environment...");
    
    // Log user in directly
    state.loggedIn = true;
    state.user.name = name;
    state.user.email = email;
    
    document.getElementById('sidebar-user-name').innerText = state.user.name;
    document.getElementById('sidebar-avatar-placeholder').innerText = state.user.name.split(' ').map(n => n[0]).join('');
    document.getElementById('dashboard-welcome-msg').innerText = `Welcome back, ${state.user.name.split(' ')[0]}. Your sandbox environment is live.`;
    document.getElementById('settings-name').value = state.user.name;
    document.getElementById('settings-email').value = state.user.email;
    
    auditLog("Clearance Init", `Sandbox created for ${name} (${email})`, "System");
    window.location.hash = '#/dashboard';
}

function handleForgotSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    showToast("Security Key Re-issued", `Recovery vector sent to ${email}. Check mailbox.`, "info");
    auditLog("Identity Audit", `Recovery key generated for ${email}`, "System");
    showAuthTab('login');
}

function handleLogout() {
    state.loggedIn = false;
    auditLog("User Logout", `De-authorized credentials session`, "System");
    showToast("Session Terminated", "Security cleared. Goodbye.", "info");
    window.location.hash = '#/';
}
