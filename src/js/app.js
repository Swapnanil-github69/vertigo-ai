// Global app event listeners and bootstrap
function handleGlobalSearch(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('global-search-input');
        const val = input.value.toUpperCase().trim();
        if (!val) return;
        
        if (state.assets[val]) {
            input.value = '';
            auditLog("Header Search", `Searched for ${val}`, "User");
            window.location.hash = `#/stock/${val}`;
        } else {
            showToast("Asset Lookup Failed", `Ticker ${val} is not cataloged in sandbox.`, "error");
        }
    }
}

function loadLogsTable() {
    const body = document.getElementById('logs-table-body');
    if (!body) return;
    body.innerHTML = '';
    
    state.logs.forEach(log => {
        const isSystem = log.type === 'System';
        const isAI = log.type.includes('AI');
        
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 border-b border-white/5 transition-colors";
        row.innerHTML = `
            <td class="px-4 py-4 text-on-surface-variant font-label-md">${log.time}</td>
            <td class="px-4 py-4 font-bold text-white">${log.action}</td>
            <td class="px-4 py-4 text-on-surface-variant leading-relaxed">${log.detail}</td>
            <td class="px-4 py-4 text-right">
                <span class="px-2 py-0.5 rounded text-[10px] font-label-sm border ${
                    isSystem ? 'bg-primary-container border-white/10 text-white' :
                    isAI ? 'bg-secondary/15 text-secondary border border-secondary/30' :
                    'bg-tertiary/15 text-tertiary border border-tertiary/30'
                }">
                    ${log.type}
                </span>
            </td>
        `;
        body.appendChild(row);
    });
}

// Global bootstrap listeners
window.addEventListener('hashchange', router);

window.addEventListener('load', () => {
    // Initial route check
    router();
    
    // Mouse hover effect for premium cards
    document.addEventListener('mousemove', e => {
        document.querySelectorAll('.glass-panel-interactive').forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
});
