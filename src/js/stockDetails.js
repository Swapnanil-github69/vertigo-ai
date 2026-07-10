// Stock details view controllers
function loadStockDetails(ticker) {
    state.activeStock = ticker;
    const asset = state.assets[ticker];
    if (!asset) {
        window.location.hash = '#/dashboard';
        return;
    }
    
    // Set text coordinates
    document.getElementById('stock-detail-avatar').innerText = ticker[0];
    document.getElementById('stock-detail-name').innerText = asset.name;
    document.getElementById('stock-detail-symbol').innerText = asset.symbol;
    document.getElementById('stock-detail-sector').innerText = asset.sector;
    document.getElementById('stock-detail-price').innerText = `$${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    
    const isPositive = asset.change >= 0;
    const changeNode = document.getElementById('stock-detail-change');
    changeNode.className = `text-xs font-label-md flex items-center justify-end mt-0.5 ${isPositive ? 'text-tertiary' : 'text-error'}`;
    changeNode.innerHTML = `<span class="material-symbols-outlined text-sm mr-0.5">${isPositive ? 'trending_up' : 'trending_down'}</span>${isPositive ? '+' : ''}${asset.change.toFixed(2)} (${isPositive ? '+' : ''}${asset.pctChange.toFixed(2)}%)`;
    
    // Watchlist state sync
    updateDetailWatchlistBtn();

    // AI indicators
    document.getElementById('stock-detail-ai-score').innerText = `${asset.aiScore} / 100`;
    document.getElementById('stock-detail-volatility').innerText = asset.volatility;
    document.getElementById('stock-detail-beta').innerText = asset.beta;
    
    const sentimentNode = document.getElementById('stock-detail-sentiment');
    sentimentNode.innerText = asset.sentiment;
    sentimentNode.className = `font-bold ${asset.sentiment === 'Bullish' ? 'text-tertiary' : asset.sentiment === 'Bearish' ? 'text-error' : 'text-secondary'}`;
    
    document.getElementById('stock-detail-recommendation-p').innerText = asset.recommendation;
    
    // Financial metrics
    document.getElementById('stock-detail-mcap').innerText = asset.mcap;
    document.getElementById('stock-detail-pe').innerText = asset.pe;
    document.getElementById('stock-detail-range').innerText = asset.range;
    document.getElementById('stock-detail-volume').innerText = asset.volume;
    
    // Draw chart SVG path
    const svgChart = document.getElementById('stock-detail-svg-chart');
    const strokeColor = isPositive ? '#1FCA17' : '#ef4444';
    svgChart.innerHTML = `
        <path d="${asset.chartPath}" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round"></path>
        <path d="${asset.chartPath} L500 150 L0 150 Z" fill="url(#detailGrad)" stroke="none"></path>
        <defs>
            <linearGradient id="detailGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.3"></stop>
                <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0"></stop>
            </linearGradient>
        </defs>
    `;
    
    // Render news correlation items
    const newsFeed = document.getElementById('stock-detail-news-feed');
    newsFeed.innerHTML = '';
    asset.news.forEach(item => {
        const div = document.createElement('div');
        div.className = "p-4 bg-white/5 border border-white/5 rounded-lg text-xs hover:bg-white/10 transition-colors";
        div.innerHTML = `
            <div class="flex justify-between items-start gap-3 mb-2">
                <h5 class="font-bold text-white leading-snug">${item.headline}</h5>
                <span class="text-[9px] font-label-sm px-1.5 py-0.5 rounded border border-white/10 opacity-70">${item.impact}</span>
            </div>
            <div class="flex justify-between text-[10px] text-on-surface-variant font-label-sm">
                <span>Source: ${item.source}</span>
                <span>${item.age}</span>
            </div>
        `;
        newsFeed.appendChild(div);
    });
    
    auditLog("Stock View", `Loaded market coordinates for ${ticker}`, "User");
}

function updateDetailWatchlistBtn() {
    const btn = document.getElementById('detail-watchlist-btn');
    const inWatch = state.watchlist.includes(state.activeStock);
    btn.innerHTML = `
        <span class="material-symbols-outlined text-sm">${inWatch ? 'bookmark_added' : 'bookmark'}</span>
        <span>${inWatch ? 'Saved' : 'Watch'}</span>
    `;
    btn.className = `px-5 py-3 rounded-lg border font-label-md text-xs hover:bg-white/10 transition-all flex items-center gap-1.5 ${
        inWatch ? 'border-secondary/20 bg-secondary/10 text-secondary' : 'border-white/10 bg-white/5 text-white'
    }`;
}

function toggleWatchlistDetail() {
    toggleWatchlist(state.activeStock);
    updateDetailWatchlistBtn();
}

function toggleWatchlist(ticker) {
    const idx = state.watchlist.indexOf(ticker);
    if (idx > -1) {
        state.watchlist.splice(idx, 1);
        showToast("Watchlist Updated", `Removed ${ticker} from watchlist.`, "info");
        auditLog("Watchlist Remove", `Removed ${ticker} from surveillance targets`, "User");
    } else {
        state.watchlist.push(ticker);
        showToast("Watchlist Updated", `Added ${ticker} to surveillance targets.`, "success");
        auditLog("Watchlist Add", `Added ${ticker} to surveillance targets`, "User");
    }
    // If in watchlist view, reload
    if (window.location.hash === '#/watchlist') {
        typeof loadWatchlistView === 'function' && loadWatchlistView();
    }
}
