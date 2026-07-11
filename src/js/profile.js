// Profile page and completion widgets controller

// Sync global reactive state and update avatar nodes dynamically
function syncGlobalUserState(user) {
    if (!user) return;
    
    // Update local state variables
    state.user = {
        ...state.user,
        ...user
    };

    // Update avatar images throughout the application
    updateAllAvatars(state.user.avatarUrl, state.user.name);

    // Update username labels in sidebar and layout
    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName) {
        sidebarName.innerText = state.user.name;
        sidebarName.title = state.user.name;
    }
    
    const menuName = document.getElementById('menu-user-name');
    if (menuName) menuName.innerText = state.user.name;
    
    const menuEmail = document.getElementById('menu-user-email');
    if (menuEmail) menuEmail.innerText = state.user.email;

    // Check dashboard completion card
    updateDashboardCompletionCard();
}

// Update avatar selectors
function updateAllAvatars(url, name) {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AV';
    
    const elements = [
        document.getElementById('sidebar-avatar-placeholder'),
        document.getElementById('header-avatar-btn'),
        document.getElementById('profile-large-avatar-placeholder')
    ];

    elements.forEach(el => {
        if (!el) return;
        if (url) {
            const finalUrl = (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) ? url : (BACKEND_URL + url);
            el.innerHTML = `<img src="${finalUrl}" class="w-full h-full object-cover rounded-full" alt="User Avatar" />`;
        } else {
            el.innerHTML = initials;
        }
    });
}

// Render Dashboard Profile Completion Alert
function updateDashboardCompletionCard() {
    const container = document.getElementById('dashboard-profile-completion-container');
    if (!container) return;

    const completion = state.user.profileCompletion || 0;
    
    if (completion < 100 && state.loggedIn) {
        container.classList.remove('hidden');
        
        // Update texts
        const pctText = document.getElementById('profile-completion-percentage-text');
        if (pctText) pctText.innerText = `${completion}%`;
        
        // Animate progress bar with a slight timeout to trigger transition
        setTimeout(() => {
            const bar = document.getElementById('profile-completion-progress-bar');
            if (bar) bar.style.width = `${completion}%`;
        }, 100);
    } else {
        container.classList.add('hidden');
    }
}

// Floating user menu dropdown toggles
function toggleUserMenu(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('user-menu-dropdown');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden-state');
    closeAllDropdowns();

    if (isHidden) {
        dropdown.classList.remove('hidden-state');
        dropdown.classList.add('show-state');
        const btnRect = e.currentTarget.getBoundingClientRect();
        const isHeader = e.currentTarget.id === 'header-avatar-btn';
        
        if (isHeader) {
            dropdown.style.top = `${btnRect.bottom + 8}px`;
            dropdown.style.right = `${window.innerWidth - btnRect.right}px`;
            dropdown.style.left = 'auto';
            dropdown.style.bottom = 'auto';
        } else {
            dropdown.style.bottom = `${window.innerHeight - btnRect.top + 8}px`;
            dropdown.style.left = `${btnRect.left}px`;
            dropdown.style.right = 'auto';
            dropdown.style.top = 'auto';
        }
    } else {
        dropdown.classList.add('hidden-state');
        dropdown.classList.remove('show-state');
    }
}

// Auto close on window click
document.addEventListener('click', () => {
    closeAllDropdowns();
});

// Close dropdown on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllDropdowns();
    }
});

function closeAllDropdowns() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden-state');
        dropdown.classList.remove('show-state');
    }
}

// Load and render Profile page
async function loadProfileView() {
    try {
        const res = await apiFetch('/api/profile');
        if (res.success && res.data) {
            syncGlobalUserState(res.data);
            renderProfileDetails(res.data);
        }
    } catch (err) {
        showToast("Profile Loading Failed", err.message || "Failed to retrieve profile coordinates.", "error");
    }
}

function renderProfileDetails(user) {
    // Large details
    const fullNameNode = document.getElementById('profile-full-name');
    if (fullNameNode) fullNameNode.innerText = user.name;
    
    const emailNode = document.getElementById('profile-email-addr');
    if (emailNode) emailNode.innerText = user.email;

    // Badges
    const providerBadge = document.getElementById('profile-provider-badge');
    if (providerBadge) {
        providerBadge.innerText = user.provider === 'google' ? 'Google Account' : 'Credentials Identity';
        if (user.provider === 'google') {
            providerBadge.className = "text-[8px] font-bold px-1.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/35 rounded tracking-wide uppercase flex items-center gap-1";
            providerBadge.innerHTML = `<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> <span>Google</span>`;
        } else {
            providerBadge.className = "text-[8px] font-bold px-1.5 py-0.5 bg-neutral/15 text-neutral border border-neutral/35 rounded tracking-wide uppercase";
        }
    }

    // Google Sync Button Visibility
    const syncBtn = document.getElementById('profile-sync-btn');
    if (syncBtn) {
        if (user.provider === 'google') {
            syncBtn.classList.remove('hidden');
        } else {
            syncBtn.classList.add('hidden');
        }
    }

    // Table details
    document.getElementById('profile-first-name').innerText = user.firstName || '-';
    document.getElementById('profile-last-name').innerText = user.lastName || '-';
    document.getElementById('profile-phone').innerText = user.phoneNumber || 'Not Completed';
    document.getElementById('profile-dob').innerText = user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not Completed';
    document.getElementById('profile-country').innerText = user.country || 'Not Completed';
    document.getElementById('profile-lang').innerText = user.language ? user.language.toUpperCase() : 'EN';
    document.getElementById('profile-timezone').innerText = user.timezone || 'UTC';

    // Account stats
    document.getElementById('profile-created-at').innerText = new Date(user.createdAt).toLocaleString();
    document.getElementById('profile-last-login').innerText = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-';
    document.getElementById('profile-login-count').innerText = user.loginCount || 1;

    // Stability Completion ring & text
    const completionPct = user.profileCompletion || 0;
    const pctNode = document.getElementById('profile-completion-pct');
    if (pctNode) pctNode.innerText = `${completionPct}%`;

    const ring = document.getElementById('profile-completion-ring');
    if (ring) {
        // Circumference is 2 * pi * r = 2 * 3.14159 * 15.915 = 100
        ring.setAttribute('stroke-dasharray', `${completionPct} 100`);
    }
}

// Open / Close Edit Profile Modal
function openEditProfileModal() {
    closeAllDropdowns();
    
    // Prefill form
    document.getElementById('edit-profile-name').value = state.user.name || '';
    document.getElementById('edit-profile-phone').value = state.user.phoneNumber || '';
    document.getElementById('edit-profile-dob').value = state.user.dateOfBirth ? new Date(state.user.dateOfBirth).toISOString().substring(0, 10) : '';
    document.getElementById('edit-profile-country').value = state.user.country || '';
    document.getElementById('edit-profile-lang').value = state.user.language || 'en';
    document.getElementById('edit-profile-timezone').value = state.user.timezone || 'UTC';

    // File input reset
    document.getElementById('edit-profile-avatar-file').value = '';
    document.getElementById('selected-avatar-filename').innerText = 'No file chosen';

    // Toggle Revert and Delete photo buttons in modal
    const revertBtn = document.getElementById('avatar-revert-btn');
    const deleteBtn = document.getElementById('avatar-delete-btn');
    
    if (state.user.googleAvatarUrl && state.user.avatarUrl !== state.user.googleAvatarUrl) {
        revertBtn.classList.remove('hidden');
    } else {
        revertBtn.classList.add('hidden');
    }

    if (state.user.avatarUrl) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }

    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.classList.add('hidden');
}

// Form Submission for updates
async function handleEditProfileSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('edit-profile-name').value;
    const phoneNumber = document.getElementById('edit-profile-phone').value;
    const dateOfBirth = document.getElementById('edit-profile-dob').value;
    const country = document.getElementById('edit-profile-country').value;
    const language = document.getElementById('edit-profile-lang').value;
    const timezone = document.getElementById('edit-profile-timezone').value;

    const payload = {
        name,
        phoneNumber,
        dateOfBirth: dateOfBirth || null,
        country,
        language,
        timezone
    };

    try {
        // 1. Save Text Details
        const res = await apiFetch('/api/profile', {
            method: 'PUT',
            body: payload
        });

        if (res.success) {
            syncGlobalUserState(res.data);
            
            // 2. Save Avatar File if selected
            const fileInput = document.getElementById('edit-profile-avatar-file');
            if (fileInput.files.length > 0) {
                await uploadAvatarFile(fileInput.files[0]);
            }

            showToast("Profile Updated", "Security profile variables synchronized.", "success");
            closeEditProfileModal();
            
            // Refresh view
            if (window.location.hash === '#/profile') {
                loadProfileView();
            }
        }
    } catch (err) {
        showToast("Update Failed", err.message || "Failed to update profile values.", "error");
    }
}

// Handle Local File Selection
function handleAvatarFileSelect(e) {
    const file = e.target.files[0];
    const label = document.getElementById('selected-avatar-filename');
    if (file && label) {
        label.innerText = file.name;
    }
}

// AJAX Avatar Upload
async function uploadAvatarFile(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BACKEND_URL + '/api/profile/avatar', {
        method: 'POST',
        headers,
        body: formData
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to upload profile image.');
    }

    syncGlobalUserState(json.data);
}

// Revert to Google profile image
async function revertProfileAvatar() {
    try {
        const res = await apiFetch('/api/profile/avatar/revert', { method: 'POST' });
        if (res.success) {
            syncGlobalUserState(res.data);
            showToast("Avatar Reverted", "Google account picture synchronized.", "success");
            closeEditProfileModal();
            if (window.location.hash === '#/profile') loadProfileView();
        }
    } catch (err) {
        showToast("Action Failed", err.message || "Failed to revert profile picture.", "error");
    }
}

// Delete custom profile image
async function deleteProfileAvatar() {
    try {
        const res = await apiFetch('/api/profile/avatar', { method: 'DELETE' });
        if (res.success) {
            syncGlobalUserState(res.data);
            showToast("Avatar Removed", "Avatar set to default.", "info");
            closeEditProfileModal();
            if (window.location.hash === '#/profile') loadProfileView();
        }
    } catch (err) {
        showToast("Action Failed", err.message || "Failed to clear profile picture.", "error");
    }
}

// Explicit Google Profile Sync trigger
async function syncGoogleIdentity() {
    // To sync, we request Google Auth client to verify.
    // If we've authenticated with Google, we can trigger a re-auth using Google Identity Services client or re-exchange.
    // A simpler elegant trigger is to show a toast, and since we already sync on login, let's inform the user.
    // We can also trigger the normal Google login popup window to refresh all details!
    showToast("Synchronizing Identity", "Re-fetching Google coordinates...", "info");
    triggerGoogleLogin();
}
