// Alerts view controllers
function loadAlertsView() {
    const body = document.getElementById('alerts-table-body');
    body.innerHTML = '';
    
    state.alerts.forEach(alert => {
        const isPriceAbove = alert.type.includes('Above');
        const isPriceBelow = alert.type.includes('Below');
        const isVol = alert.type.includes('Volatility');
        
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 border-b border-white/5 transition-colors";
        row.innerHTML = `
            <td class="px-4 py-4 font-bold text-white">${alert.ticker}</td>
            <td class="px-4 py-4">
                <span class="px-2 py-0.5 rounded text-[10px] font-label-sm ${
                    isVol ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-primary-container border border-white/10 text-white'
                }">
                    ${alert.type}
                </span>
            </td>
            <td class="px-4 py-4 text-on-surface-variant font-label-sm">${alert.condition}</td>
            <td class="px-4 py-4">
                <span class="flex items-center gap-1.5 text-tertiary">
                    <span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                    <span>${alert.status}</span>
                </span>
            </td>
            <td class="px-4 py-4 text-on-surface-variant">${alert.created}</td>
            <td class="px-4 py-4 text-right">
                <button onclick="deleteAlert(${alert.id})" class="p-1 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-error transition-colors" title="Delete watchdog trigger">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}

function openNewAlertModal() {
    document.getElementById('new-alert-modal').classList.remove('hidden');
}

function closeNewAlertModal() {
    document.getElementById('new-alert-modal').classList.add('hidden');
}

function handleCreateAlertSubmit(e) {
    e.preventDefault();
    const ticker = document.getElementById('modal-alert-asset').value;
    const type = document.getElementById('modal-alert-type').value;
    const val = document.getElementById('modal-alert-val').value;
    
    const cond = type.includes('Above') ? `Above $${val}` : type.includes('Below') ? `Below $${val}` : `${type} ${val}`;
    
    state.alerts.unshift({
        id: Date.now(),
        ticker,
        type,
        condition: cond,
        status: "Active",
        created: "Just now"
    });
    
    closeNewAlertModal();
    showToast("Alert Activated", `Surveillance watchdog set for ${ticker} ${cond}.`, "success");
    auditLog("Alert Set", `Created watchdog trigger for ${ticker} (${cond})`, "User");
    
    // Reload views
    if (window.location.hash === '#/alerts') loadAlertsView();
    if (typeof loadDashboard === 'function') loadDashboard();
}

function deleteAlert(id) {
    const alert = state.alerts.find(a => a.id === id);
    state.alerts = state.alerts.filter(a => a.id !== id);
    if (alert) {
        showToast("Watchdog Deactivated", `Removed alert on ${alert.ticker}.`, "info");
        auditLog("Alert Deleted", `Removed alert for ${alert.ticker} (${alert.condition})`, "User");
    }
    loadAlertsView();
    if (typeof loadDashboard === 'function') loadDashboard();
}
