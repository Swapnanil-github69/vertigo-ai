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
    document.getElementById('auth-reset-pane').classList.add('hidden');
    
    document.getElementById(`auth-${tab}-pane`).classList.remove('hidden');
    clearAllErrors();

    if (tab !== 'otp' && tab !== 'reset' && otpInterval) {
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
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        displayInputError('signup-confirm-password', "Passwords do not match.");
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
        return;
    }
    
    try {
        const res = await apiFetch('/api/auth/signup', {
            method: 'POST',
            body: { name, email, password, confirmPassword }
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
        } else if (msg.toLowerCase().includes('confirm')) {
            displayInputError('signup-confirm-password', msg);
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
        
        showAuthTab('reset');
    } catch (err) {
        const msg = err.message || "Failed to trigger recovery.";
        displayInputError('forgot-email', msg);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
}

async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    clearAllErrors();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;

    submitBtn.disabled = true;
    submitBtn.innerText = "Resetting...";

    const code = document.getElementById('reset-code').value;
    const newPassword = document.getElementById('reset-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;

    if (newPassword !== confirmPassword) {
        displayInputError('reset-confirm-password', "Passwords do not match.");
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
        return;
    }

    try {
        await apiFetch('/api/auth/reset-password', {
            method: 'POST',
            body: {
                email: otpContext.email,
                code,
                newPassword
            }
        });

        showToast("Credentials Restructured", "Password updated successfully. Please authenticate session.", "success");
        showAuthTab('login');
    } catch (err) {
        const msg = err.message || "Failed to reset password.";
        if (msg.toLowerCase().includes('code') || msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
            displayInputError('reset-code', msg);
        } else if (msg.toLowerCase().includes('password')) {
            displayInputError('reset-password', msg);
        } else {
            showToast("Reset Failed", msg, "error");
        }
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

let isGoogleConfigured = false;
let googleInitError = null;

async function checkGoogleConfig() {
    try {
        const res = await apiFetch('/api/auth/google/config');
        if (res.success && res.data.configured) {
            isGoogleConfigured = true;
        } else {
            googleInitError = res.data.error || "Google Auth configuration is missing on the server.";
            console.error("❌ Google Login Configuration Error:", googleInitError);
        }
    } catch (err) {
        googleInitError = "Failed to fetch Google configuration from the backend.";
        console.error("❌ Google Login Configuration Error:", err);
    }
}

function triggerGoogleLogin() {
    if (!isGoogleConfigured) {
        showToast("Configuration Error", googleInitError || "Google Authentication is not configured on the server. Please verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in .env.", "error");
        console.error("❌ Google Login Trigger Failed:", googleInitError);
        return;
    }
    
    const origin = window.location.origin;
    const backend = window.location.port === '3000' ? 'http://localhost:8000' : '';
    
    // Centered popup window
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
        `${backend}/api/auth/google?state=${encodeURIComponent(origin)}`,
        "GoogleSignIn",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );
    
    if (!popup) {
        showToast("Popup Blocked", "Please allow popups for this site to sign in with Google.", "error");
        return;
    }
}

// Intercept clicks on Google OAuth buttons to inject current origin as state
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href="/api/auth/google"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerGoogleLogin();
        });
    });
    
    // Listen for popup messages
    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            const token = event.data.token;
            accessToken = token;
            localStorage.setItem('accessToken', token);
            checkAuthSession();
            showToast("Identity Approved", "Google authentication successful.");
        }
        if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
            let friendlyMsg = "Google Authentication failed.";
            const errorParam = event.data.error;
            if (errorParam === 'OAuthCallbackError' || errorParam === 'TokenExchangeFailed') {
                friendlyMsg = "Google Authentication Failed. Token exchange failed.";
            } else if (errorParam === 'FetchUserInfoFailed') {
                friendlyMsg = "Google Authentication Failed. User profile could not be parsed.";
            } else if (errorParam === 'CodeMissing') {
                friendlyMsg = "Google Authentication Failed. Authorization code missing.";
            }
            showToast("Google Authentication Failed", friendlyMsg, "error");
        }
    });
    
    checkGoogleConfig();
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
    
    // If running in a popup window, notify opener and close self
    if (window.opener && window.opener !== window) {
        try {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: tokenParam }, window.location.origin);
            window.close();
        } catch (e) {
            console.error("Failed to notify opener:", e);
        }
    } else {
        accessToken = tokenParam;
        localStorage.setItem('accessToken', tokenParam);
    }
}

if (errorParam) {
    window.location.hash = hashParts[0]; // strip parameters
    
    // If running in a popup window, notify opener and close self
    if (window.opener && window.opener !== window) {
        try {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: errorParam }, window.location.origin);
            window.close();
        } catch (e) {
            console.error("Failed to notify opener:", e);
        }
    } else {
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
}

if (otpRequiredParam && emailParam) {
    window.location.hash = hashParts[0]; // strip parameters
    otpContext = { email: decodeURIComponent(emailParam), type: 'LOGIN' };
    
    const maskedSpan = document.getElementById('otp-masked-email');
    if (maskedSpan) maskedSpan.innerText = maskEmail(otpContext.email);
    
    showToast("Risk Assessment Triggered", "Unrecognized device. OTP verification required.", "info");
    showAuthTab('otp');
    startOtpCountdown();
} else if (!tokenParam && !errorParam) {
    checkAuthSession();
}
