// Dashboard rendering controllers
function loadDashboard() {
    const grid = document.getElementById('dashboard-trending-grid');
    grid.innerHTML = '';
    
    // Load default trending tickers
    const tickers = ["NVDA", "AAPL", "MSFT", "TSLA"];
    tickers.forEach(ticker => {
        const asset = state.assets[ticker];
        if (!asset) return;
        const isPositive = asset.change >= 0;
        const card = document.createElement('div');
        card.className = "glass-panel p-5 rounded-xl flex flex-col justify-between hover:bg-white/10 transition-all cursor-pointer border border-white/5 active:translate-y-0.5 overflow-hidden";
        card.onclick = () => window.location.hash = `#/stock/${ticker}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h5 class="font-bold text-sm text-white">${asset.symbol}</h5>
                    <p class="text-[10px] text-on-surface-variant truncate">${asset.name}</p>
                </div>
                <span class="text-[9px] font-label-sm px-2 py-0.5 ${isPositive ? 'bg-tertiary/15 text-tertiary border border-tertiary/30' : 'bg-error/15 text-error border border-error/30'} rounded">
                    AI SCORE: ${asset.aiScore}
                </span>
            </div>
            <div class="flex justify-between items-end mt-4">
                <div>
                    <p class="text-xs text-on-surface-variant font-label-sm">PRICE</p>
                    <p class="text-lg font-bold font-label-md text-white">$${asset.price.toFixed(2)}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-on-surface-variant font-label-sm">24H CHANGE</p>
                    <span class="${isPositive ? 'text-tertiary' : 'text-error'} font-semibold text-xs flex items-center font-label-md">
                        ${isPositive ? '+' : ''}${asset.pctChange.toFixed(2)}%
                    </span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    document.getElementById('dashboard-active-alerts-count').innerText = `${state.alerts.length} Alerts`;
}
