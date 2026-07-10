// Client Side Routing Engine
function updateActiveLinks(hash) {
    // Sidebar links active class toggle
    document.querySelectorAll('.nav-sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    let activeId = '';
    if (hash === '#/dashboard') activeId = 'sidebar-dashboard';
    else if (hash === '#/markets' || hash.startsWith('#/stock')) activeId = 'sidebar-markets';
    else if (hash === '#/portfolio') activeId = 'sidebar-portfolio';
    else if (hash === '#/watchlist') activeId = 'sidebar-watchlist';
    else if (hash === '#/ai-assistant') activeId = 'sidebar-ai-assistant';
    else if (hash === '#/ai-scanner') activeId = 'sidebar-ai-scanner';
    else if (hash === '#/compare') activeId = 'sidebar-compare';
    else if (hash === '#/reports') activeId = 'sidebar-reports';
    else if (hash === '#/alerts') activeId = 'sidebar-alerts';
    else if (hash === '#/logs') activeId = 'sidebar-logs';
    else if (hash === '#/settings') activeId = 'sidebar-settings';
    
    const activeLink = document.getElementById(activeId);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Public Header Links active class toggle
    document.querySelectorAll('.nav-link').forEach(link => {
        link.className = "nav-link text-on-surface-variant hover:text-on-surface transition-colors text-body-md";
    });
    let publicNavHref = '#/';
    if (hash === '#/about') publicNavHref = '#/about';
    else if (hash === '#/auth') publicNavHref = '#/auth';
    
    const activePublicLink = document.querySelector(`.nav-link[href="${publicNavHref}"]`);
    if (activePublicLink) {
        activePublicLink.className = "nav-link text-primary font-bold border-b-2 border-primary py-1 text-body-md";
    }
}

function router() {
    const rawHash = window.location.hash || '#/';
    const hash = rawHash.split('?')[0];
    const publicRoutes = ['#/', '#/about', '#/auth'];
    const isPublic = publicRoutes.includes(hash);
    
    // Auth Guard redirection
    if (!state.loggedIn && !isPublic) {
        window.location.hash = '#/auth';
        return;
    }
    if (state.loggedIn && hash === '#/auth') {
        window.location.hash = '#/dashboard';
        return;
    }
    
    // Toggle route containers
    document.querySelectorAll('.route-view').forEach(view => view.classList.add('hidden'));
    
    let viewId = 'view-landing';
    if (hash === '#/about') viewId = 'view-about';
    else if (hash === '#/auth') viewId = 'view-auth';
    else if (hash === '#/dashboard') viewId = 'view-dashboard';
    else if (hash === '#/markets') viewId = 'view-markets';
    else if (hash.startsWith('#/stock')) viewId = 'view-stock-details';
    else if (hash === '#/portfolio') viewId = 'view-portfolio';
    else if (hash === '#/watchlist') viewId = 'view-watchlist';
    else if (hash === '#/ai-assistant') viewId = 'view-ai-assistant';
    else if (hash === '#/ai-scanner') viewId = 'view-ai-scanner';
    else if (hash === '#/compare') viewId = 'view-compare';
    else if (hash === '#/reports') viewId = 'view-reports';
    else if (hash === '#/alerts') viewId = 'view-alerts';
    else if (hash === '#/logs') viewId = 'view-logs';
    else if (hash === '#/settings') viewId = 'view-settings';
    
    const view = document.getElementById(viewId);
    if (view) view.classList.remove('hidden');
    
    // Switch auth tab if on auth page
    if (hash === '#/auth') {
        const urlParams = new URLSearchParams(rawHash.split('?')[1] || '');
        const tab = urlParams.get('tab') || 'login';
        if (typeof showAuthTab === 'function') {
            showAuthTab(tab);
        }
    }
    
    // Switch layout shells
    const publicShell = document.getElementById('public-layout-shell');
    const authShell = document.getElementById('authenticated-layout-shell');
    
    if (isPublic) {
        publicShell.classList.remove('hidden');
        authShell.classList.add('hidden');
    } else {
        publicShell.classList.add('hidden');
        authShell.classList.remove('hidden');
        // Scroll body viewport to top
        const viewport = document.getElementById('authenticated-content-viewport') || document.querySelector('main');
        if (viewport) viewport.scrollTop = 0;
    }
    
    // Trigger View Load initializations
    if (hash === '#/dashboard') typeof loadDashboard === 'function' && loadDashboard();
    else if (hash === '#/markets') typeof filterMarketsTable === 'function' && filterMarketsTable();
    else if (hash.startsWith('#/stock')) {
        const parts = hash.split('/');
        const ticker = parts[2] || 'NVDA';
        typeof loadStockDetails === 'function' && loadStockDetails(ticker);
    }
    else if (hash === '#/portfolio') typeof loadPortfolioView === 'function' && loadPortfolioView();
    else if (hash === '#/watchlist') typeof loadWatchlistView === 'function' && loadWatchlistView();
    else if (hash === '#/ai-assistant') typeof loadChatHistory === 'function' && loadChatHistory();
    else if (hash === '#/ai-scanner') typeof loadOpportunityScanner === 'function' && loadOpportunityScanner();
    else if (hash === '#/compare') typeof loadCompareView === 'function' && loadCompareView();
    else if (hash === '#/reports') typeof loadReportsView === 'function' && loadReportsView();
    else if (hash === '#/alerts') typeof loadAlertsView === 'function' && loadAlertsView();
    else if (hash === '#/logs') typeof loadLogsTable === 'function' && loadLogsTable();
    else if (hash === '#/settings') typeof loadSettingsView === 'function' && loadSettingsView();
    
    updateActiveLinks(hash);
}

// Mobile sidebar helper
function toggleMobileSidebar() {
    const sidebar = document.getElementById('mobile-sidebar');
    sidebar.classList.toggle('hidden');
}
