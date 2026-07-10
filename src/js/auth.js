// Global OTP verification state context
let otpContext = {
    email: '',
    type: ''
};

let otpInterval = null;

function showAuthTab(tab) {
    document.getElementById('auth-login-pane').classList.add('hidden');
    document.getElementById('auth-signup-pane').classList.add('hidden');
    document.getElementById('auth-forgot-pane').classList.add('hidden');
    document.getElementById('auth-otp-pane').classList.add('hidden');
    
    document.getElementById(`auth-${tab}-pane`).classList.remove('hidden');
    clearAllErrors();

    if (tab !== 'otp' && otpInterval) {
        clearInterval(otpInterval);
    }
}

function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 2) {
        return `${name}***@${domain}`;
    }
    return `${name.substring(0, 2)}******@${domain}`;
}

function startOtpCountdown() {
    if (otpInterval) clearInterval(otpInterval);
    const timerDisplay = document.getElementById('otp-timer');
    const resendBtn = document.querySelector('button[onclick="resendOtpCode()"]');
    
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.style.opacity = '0.5';
    }

    let timeLeft = 300; // 5 minutes (300 seconds)

    function updateDisplay() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        if (timerDisplay) {
            timerDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        if (timeLeft <= 0) {
            clearInterval(otpInterval);
            if (timerDisplay) timerDisplay.innerText = 'EXPIRED';
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.style.opacity = '1';
            }
        }
        timeLeft--;
    }

    updateDisplay();
    otpInterval = setInterval(updateDisplay, 1000);
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('span');
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerText = 'visibility_off';
    } else {
        input.type = 'password';
        icon.innerText = 'visibility';
    }
}

function displayInputError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Remove existing error if any
    const existing = document.getElementById(`error-msg-${inputId}`);
    if (existing) existing.remove();
    
    if (message) {
        const errNode = document.createElement('p');
        errNode.id = `error-msg-${inputId}`;
        errNode.className = 'text-error text-[10px] mt-1 font-sans';
        errNode.innerText = message;
        
        // Insert right after the input parent container (relative wrapper or directly input)
        const insertTarget = input.closest('.relative') || input;
        insertTarget.insertAdjacentElement('afterend', errNode);
    }
}

function clearAllErrors() {
    document.querySelectorAll('[id^="error-msg-"]').forEach(el => el.remove());
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    clearAllErrors();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    
    submitBtn.disabled = true;
    submitBtn.innerText = "Authenticating...";

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const res = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        if (res.data && res.data.otpRequired) {
            otpContext = { email, type: 'LOGIN' };
            
            // Mask and set email element
            const maskedSpan = document.getElementById('otp-masked-email');
            if (maskedSpan) maskedSpan.innerText = maskEmail(email);

            showToast("Verification Required", "A 6-digit login authorization key has been sent.", "info");
            showAuthTab('otp');
            startOtpCountdown();
        } else {
            completeAuthentication(res.data.accessToken, res.data.user);
            showToast("Credentials Verified", `Welcome back to Vertigo Terminal, ${state.user.name.split(' ')[0]}.`);
        }
    } catch (err) {
        const msg = err.message || "Invalid credentials combination.";
        if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('found')) {
            displayInputError('login-email', msg);
        } else if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('incorrect')) {
            displayInputError('login-password', msg);
        } else {
            showToast("Authentication Failed", msg, "error");
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    clearAllErrors();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    
    submitBtn.disabled = true;
    submitBtn.innerText = "Initializing...";

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

            // Mask and set email element
            const maskedSpan = document.getElementById('otp-masked-email');
            if (maskedSpan) maskedSpan.innerText = maskEmail(email);

            showToast("Clearance Initiated", "Check your mailbox for verification code.", "info");
            showAuthTab('otp');
            startOtpCountdown();
        }
    } catch (err) {
        const msg = err.message || "Failed to initiate registration.";
        if (msg.toLowerCase().includes('name')) {
            displayInputError('signup-name', msg);
        } else if (msg.toLowerCase().includes('email')) {
            displayInputError('signup-email', msg);
        } else if (msg.toLowerCase().includes('password')) {
            displayInputError('signup-password', msg);
        } else {
            showToast("Clearance Failed", msg, "error");
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
}

async function handleOtpSubmit(e) {
    e.preventDefault();
    clearAllErrors();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    
    submitBtn.disabled = true;
    submitBtn.innerText = "Verifying...";

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
        const msg = err.message || "Invalid verification code.";
        displayInputError('otp-code', msg);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
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
        startOtpCountdown();
    } catch (err) {
        showToast("Request Blocked", err.message || "Cooldown active. Try again later.", "error");
    }
}

async function handleForgotSubmit(e) {
    e.preventDefault();
    clearAllErrors();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending Vector...";

    const email = document.getElementById('forgot-email').value;
    
    try {
        await apiFetch('/api/auth/forgot-password', {
            method: 'POST',
            body: { email }
        });
        showToast("Identity Audited", `Password reset code sent to ${email}.`, "info");
        otpContext = { email, type: 'PASSWORD_RESET' };
        
        // Mask and set email element
        const maskedSpan = document.getElementById('otp-masked-email');
        if (maskedSpan) maskedSpan.innerText = maskEmail(email);

        showAuthTab('otp');
        startOtpCountdown();
    } catch (err) {
        const msg = err.message || "Failed to trigger recovery.";
        displayInputError('forgot-email', msg);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
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
        const res = await apiFetch('/api/auth/session');
        if (res.success && res.data.user) {
            const name = res.data.user.name || res.data.user.email.split('@')[0];
            completeAuthentication(accessToken, { name, email: res.data.user.email });
        }
    } catch (err) {
        accessToken = null;
        localStorage.removeItem('accessToken');
        state.loggedIn = false;
    }
}

// Intercept clicks on Google OAuth buttons to inject current origin as state
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href="/api/auth/google"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const origin = window.location.origin;
            const backend = window.location.port === '3000' ? 'http://localhost:8000' : '';
            window.location.href = `${backend}/api/auth/google?state=${encodeURIComponent(origin)}`;
        });
    });
});

// Run initial session check and parse redirect params
const hashParts = window.location.hash.split('?');
const urlParams = new URLSearchParams(hashParts[1] || '');
const tokenParam = urlParams.get('token');
const errorParam = urlParams.get('error');
const otpRequiredParam = urlParams.get('otpRequired');
const emailParam = urlParams.get('email');

if (tokenParam) {
    window.location.hash = hashParts[0]; // strip parameters
    accessToken = tokenParam;
    localStorage.setItem('accessToken', tokenParam);
}

if (errorParam) {
    window.location.hash = hashParts[0]; // strip parameters
    let friendlyMsg = "Google Authentication failed.";
    if (errorParam === 'OAuthCallbackError' || errorParam === 'TokenExchangeFailed') {
        friendlyMsg = "Google Authentication Failed. Token exchange failed.";
    } else if (errorParam === 'FetchUserInfoFailed') {
        friendlyMsg = "Google Authentication Failed. User profile could not be parsed.";
    } else if (errorParam === 'CodeMissing') {
        friendlyMsg = "Google Authentication Failed. Authorization code missing.";
    }
    showToast("Google Authentication Failed", friendlyMsg, "error");
}

if (otpRequiredParam && emailParam) {
    window.location.hash = hashParts[0]; // strip parameters
    otpContext = { email: decodeURIComponent(emailParam), type: 'LOGIN' };
    
    const maskedSpan = document.getElementById('otp-masked-email');
    if (maskedSpan) maskedSpan.innerText = maskEmail(otpContext.email);
    
    showToast("Risk Assessment Triggered", "Unrecognized device. OTP verification required.", "info");
    showAuthTab('otp');
    startOtpCountdown();
} else {
    checkAuthSession();
}
