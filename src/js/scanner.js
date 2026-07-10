// Opportunity Scanner view controllers
function loadOpportunityScanner() {
    const body = document.getElementById('scanner-table-body');
    body.innerHTML = '';
    
    state.scannedOpportunities.forEach((opp, idx) => {
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer";
        row.onclick = (e) => {
            if (e.target.closest('button')) return;
            const ticker = opp.ticker.split('.')[0];
            window.location.hash = `#/stock/${ticker}`;
        };
        row.innerHTML = `
            <td class="px-6 py-4 text-center font-bold text-on-surface-variant font-label-md">${idx + 1}</td>
            <td class="px-6 py-4 font-bold text-white">${opp.ticker}</td>
            <td class="px-6 py-4 text-center font-bold text-white">${opp.score}</td>
            <td class="px-6 py-4">
                <span class="flex items-center gap-1.5 ${opp.status === 'Bullish' ? 'text-tertiary' : 'text-secondary'}">
                    <span class="material-symbols-outlined text-sm">${opp.status === 'Bullish' ? 'sentiment_satisfied' : 'sentiment_neutral'}</span>
                    <span>${opp.status}</span>
                </span>
            </td>
            <td class="px-6 py-4 font-label-md">${opp.price}</td>
            <td class="px-6 py-4 text-on-surface-variant leading-relaxed">${opp.catalyst}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="toggleWatchlist('${opp.ticker.split('.')[0]}')" class="px-3 py-1.5 bg-white/5 border border-white/10 text-white font-semibold text-[10px] rounded hover:bg-white/10 transition-all">
                    Monitor
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}

function triggerScannerRun() {
    const panel = document.getElementById('scanner-progress-panel');
    const bar = document.getElementById('scanner-progress-bar');
    const percent = document.getElementById('scanner-progress-percent');
    const logs = document.getElementById('scanner-progress-logs');
    
    panel.classList.remove('hidden');
    bar.style.width = '0%';
    percent.innerText = '0%';
    logs.innerHTML = '';
    
    const scanLogs = [
        "Initializing neural correlation matrix mapping...",
        "Downloading order flows from 120 global nodes...",
        "Analyzing semantic streams (24,812 news items)...",
        "Assessing tail risk volatility vectors...",
        "Running recursive re-ranking algorithm...",
        "Optimization complete. 3 assets re-scored."
    ];
    
    let progress = 0;
    let logIdx = 0;
    
    const interval = setInterval(() => {
        progress += 10;
        bar.style.width = `${progress}%`;
        percent.innerText = `${progress}%`;
        
        // Output progress logs
        if (progress % 20 === 0 && logIdx < scanLogs.length) {
            const time = new Date().toLocaleTimeString('en-US', { hour12: false });
            const p = document.createElement('p');
            p.innerHTML = `<span class="text-on-surface-variant">[${time}]</span> ${scanLogs[logIdx]}`;
            logs.appendChild(p);
            logs.scrollTop = logs.scrollHeight;
            logIdx++;
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                panel.classList.add('hidden');
                showToast("Scan Completed", "Opportunities updated successfully.", "success");
                auditLog("AI Scan Triggered", "Recalculated global anomaly signals", "AI Engine");
                
                // Slightly modulate values
                state.scannedOpportunities[0].score = 97;
                state.scannedOpportunities[1].score = 91;
                loadOpportunityScanner();
            }, 500);
        }
    }, 300);
}
