// Dashboard rendering controllers
async function loadDashboard() {
    const grid = document.getElementById('dashboard-trending-grid');
    if (!grid) return;
    
    // Display skeleton loading panels in trending list while loading quotes
    grid.innerHTML = Array(4).fill(0).map(() => `
        <div class="glass-panel p-5 rounded-xl border border-white/5 animate-pulse space-y-4">
            <div class="flex justify-between items-start">
                <div class="space-y-2">
                    <div class="h-4 w-12 bg-white/10 rounded"></div>
                    <div class="h-3 w-20 bg-white/10 rounded"></div>
                </div>
                <div class="h-5 w-16 bg-white/10 rounded"></div>
            </div>
            <div class="flex justify-between items-end pt-4">
                <div class="space-y-2">
                    <div class="h-3 w-8 bg-white/10 rounded"></div>
                    <div class="h-5 w-16 bg-white/10 rounded"></div>
                </div>
                <div class="space-y-2 text-right">
                    <div class="h-3 w-16 bg-white/10 rounded"></div>
                    <div class="h-4 w-12 bg-white/10 rounded"></div>
                </div>
            </div>
        </div>
    `).join('');

    // Fetch real backend quotes and update state
    await fetchLiveQuotesForAssets();

    // Dynamically calculate and update Portfolio Stats
    let totalPortfolioValuation = 0;
    let totalCostBasis = 0;
    state.portfolio.holdings.forEach(hold => {
        const asset = state.assets[hold.ticker];
        if (asset) {
            hold.value = hold.shares * asset.price;
            hold.pnl = hold.value - (hold.shares * hold.avgCost);
            totalPortfolioValuation += hold.value;
            totalCostBasis += hold.shares * hold.avgCost;
        }
    });

    const portfolioValuationEl = document.getElementById('dashboard-portfolio-value');
    if (portfolioValuationEl) {
        portfolioValuationEl.innerText = `$${totalPortfolioValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const portfolioChangeEl = document.getElementById('dashboard-portfolio-change');
    if (portfolioChangeEl) {
        const totalPnL = totalPortfolioValuation - totalCostBasis;
        const pctPnL = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;
        const isUp = totalPnL >= 0;
        portfolioChangeEl.className = `text-xs flex items-center mt-1 ${isUp ? 'text-tertiary' : 'text-error'}`;
        portfolioChangeEl.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">${isUp ? 'trending_up' : 'trending_down'}</span>${isUp ? '+' : ''}$${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${isUp ? '+' : ''}${pctPnL.toFixed(2)}%) All-Time`;
    }

    // Dynamically calculate and update AI Health Rating
    let weightedAIScore = 0;
    let totalWeight = 0;
    state.portfolio.holdings.forEach(hold => {
        const asset = state.assets[hold.ticker];
        if (asset) {
            weightedAIScore += asset.aiScore * hold.value;
            totalWeight += hold.value;
        }
    });
    const finalAIScore = totalWeight > 0 ? Math.round(weightedAIScore / totalWeight) : 88;
    const aiRatingEl = document.getElementById('dashboard-ai-rating-value');
    if (aiRatingEl) {
        aiRatingEl.innerText = `${finalAIScore}/100`;
    }

    // Render live trending cards
    grid.innerHTML = '';
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
    
    const activeAlertsEl = document.getElementById('dashboard-active-alerts-count');
    if (activeAlertsEl) {
        activeAlertsEl.innerText = `${state.alerts.length} Alerts`;
    }
}
