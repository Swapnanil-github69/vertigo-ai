// Global OTP verification state context
let otpContext = {
    email: '',
    type: ''
};

function showAuthTab(tab) {
    document.getElementById('auth-login-pane').classList.add('hidden');
    document.getElementById('auth-signup-pane').classList.add('hidden');
    document.getElementById('auth-forgot-pane').classList.add('hidden');
    document.getElementById('auth-otp-pane').classList.add('hidden');
    
    document.getElementById(`auth-${tab}-pane`).classList.remove('hidden');
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const res = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        if (res.data && res.data.otpRequired) {
            otpContext = { email, type: 'LOGIN' };
            showToast("Verification Required", "A 6-digit login authorization key has been sent.", "info");
            showAuthTab('otp');
        } else {
            completeAuthentication(res.data.accessToken, res.data.user);
            showToast("Credentials Verified", `Welcome back to Vertigo Terminal, ${state.user.name.split(' ')[0]}.`);
        }
    } catch (err) {
        showToast("Authentication Failed", err.message || "Invalid credentials combination.", "error");
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        const res = await apiFetch('/api/auth/signup', {
            method: 'POST',
            body: { name, email, password }
        });

        if (res.data && res.data.otpRequired) {
            otpContext = { email, type: 'REGISTRATION' };
            showToast("Clearance Initiated", "Check your mailbox for verification code.", "info");
            showAuthTab('otp');
        }
    } catch (err) {
        showToast("Clearance Failed", err.message || "Failed to initiate registration.", "error");
    }
}

async function handleOtpSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('otp-code').value;
    
    try {
        const res = await apiFetch('/api/auth/verify-otp', {
            method: 'POST',
            body: {
                email: otpContext.email,
                code,
                type: otpContext.type
            }
        });

        completeAuthentication(res.data.accessToken, res.data.user);
        showToast("Identity Approved", `Verification successful. Welcome ${state.user.name.split(' ')[0]}.`);
    } catch (err) {
        showToast("Verification Failed", err.message || "Invalid verification code.", "error");
    }
}

async function resendOtpCode() {
    try {
        await apiFetch('/api/auth/resend-otp', {
            method: 'POST',
            body: {
                email: otpContext.email,
                type: otpContext.type
            }
        });
        showToast("Key Dispatched", "A new 6-digit code has been sent.", "success");
    } catch (err) {
        showToast("Request Blocked", err.message || "Cooldown active. Try again later.", "error");
    }
}

async function handleForgotSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    
    try {
        await apiFetch('/api/auth/forgot-password', {
            method: 'POST',
            body: { email }
        });
        showToast("Identity Audited", `Password reset code sent to ${email}.`, "info");
        otpContext = { email, type: 'PASSWORD_RESET' };
        // Redirect to a password reset screen or simply prompt code.
        // For simple integration, let's allow resetting password directly on OTP verified.
        // We will show OTP tab but wait: if they type it, we need a password reset OTP flow.
        // Let's adapt OTP to handle password reset!
        showAuthTab('otp');
    } catch (err) {
        showToast("Request Failed", err.message || "Failed to trigger recovery.", "error");
    }
}

async function handleLogout() {
    try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
        console.error("Logout request failed:", err);
    }
    
    accessToken = null;
    localStorage.removeItem('accessToken');
    state.loggedIn = false;
    
    showToast("Session Terminated", "Security cleared. Goodbye.", "info");
    window.location.hash = '#/';
}

function completeAuthentication(token, user) {
    accessToken = token;
    localStorage.setItem('accessToken', token);
    
    state.loggedIn = true;
    state.user.name = user.name;
    state.user.email = user.email;
    
    // Bind UI elements
    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName) {
        sidebarName.innerText = state.user.name;
        sidebarName.title = state.user.name;
    }
    const avatar = document.getElementById('sidebar-avatar-placeholder');
    if (avatar) {
        avatar.innerText = state.user.name.split(' ').map(n => n[0]).join('');
    }
    const welcome = document.getElementById('dashboard-welcome-msg');
    if (welcome) {
        welcome.innerText = `Welcome back, ${state.user.name.split(' ')[0]}. Your risk vectors are stabilized.`;
    }
    
    const settingsName = document.getElementById('settings-name');
    if (settingsName) settingsName.value = state.user.name;
    
    const settingsEmail = document.getElementById('settings-email');
    if (settingsEmail) settingsEmail.value = state.user.email;
    
    window.location.hash = '#/dashboard';
}

// Check session on load to maintain login state
async function checkAuthSession() {
    try {
        // Pinging session check
        const res = await apiFetch('/api/auth/session');
        if (res.success && res.data.user) {
            // Get user detailed profile or just name from email
            const name = res.data.user.name || res.data.user.email.split('@')[0];
            completeAuthentication(accessToken, { name, email: res.data.user.email });
        }
    } catch (err) {
        // Session invalid, clear state
        accessToken = null;
        localStorage.removeItem('accessToken');
        state.loggedIn = false;
    }
}

// Run initial session check
const hashParts = window.location.hash.split('?');
const urlParams = new URLSearchParams(hashParts[1] || '');
const tokenParam = urlParams.get('token');
if (tokenParam) {
    window.location.hash = hashParts[0]; // strip token parameter
    accessToken = tokenParam;
    localStorage.setItem('accessToken', tokenParam);
}
checkAuthSession();
