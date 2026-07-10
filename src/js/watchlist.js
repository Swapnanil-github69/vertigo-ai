// Watchlist list rendering controllers

// Centralized reference to the live tick interval to prevent memory leaks
if (window.watchlistInterval) {
    clearInterval(window.watchlistInterval);
    window.watchlistInterval = null;
}

// Procedural point generator based on ticker trend configuration
function generateProceduralPoints(ticker, pctChange, volatilityStr) {
    let volatility = 1.0;
    if (volatilityStr.includes('High')) volatility = 2.0;
    else if (volatilityStr.includes('Low')) volatility = 0.5;
    
    const numPoints = 12;
    const spacing = 100 / (numPoints - 1);
    const startY = 15;
    
    // Total drift Y corresponds to actual asset return
    let targetDeltaY = -pctChange * 2.2;
    const maxDelta = 10;
    if (targetDeltaY > maxDelta) targetDeltaY = maxDelta;
    if (targetDeltaY < -maxDelta) targetDeltaY = -maxDelta;
    
    const points = [];
    points.push([0, startY]);
    
    // Choose custom pattern based on ticker
    let pattern = 'standard';
    if (ticker === 'NVDA') pattern = 'breakout'; // explosive breakout
    if (ticker === 'AAPL') pattern = 'bullish';  // steady rise
    if (ticker === 'TSLA') pattern = 'bearish';  // steady drop
    if (ticker === 'BTC.X') pattern = 'volatile'; // high volatility
    if (ticker === 'MSFT') pattern = 'sideways';  // narrow range
    
    for (let i = 1; i < numPoints; i++) {
        const x = i * spacing;
        const progress = i / (numPoints - 1);
        
        let expectedY = startY + progress * targetDeltaY;
        let noise = (Math.random() - 0.5) * 4 * volatility;
        
        if (pattern === 'breakout') {
            if (progress < 0.7) {
                expectedY = startY + (Math.random() - 0.5) * 0.8;
            } else {
                expectedY = startY + targetDeltaY * ((progress - 0.7) / 0.3);
            }
        } else if (pattern === 'volatile') {
            noise = (Math.random() - 0.5) * 7.5 * volatility;
        } else if (pattern === 'sideways') {
            noise = (Math.random() - 0.5) * 1.2 * volatility;
            expectedY = startY;
        }
        
        let y = expectedY + noise;
        if (y < 2) y = 2;
        if (y > 28) y = 28;
        
        points.push([x, y]);
    }
    
    // Lock final Y close to expected performance
    let finalY = startY + targetDeltaY + (Math.random() - 0.5) * 0.5;
    if (finalY < 2) finalY = 2;
    if (finalY > 28) finalY = 28;
    points[numPoints - 1][1] = finalY;
    
    return points;
}

// Compute cubic Bezier control points for smooth Spline curves
function getBezierPath(points) {
    if (points.length < 2) return "";
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        
        const prev = points[i - 1] || curr;
        const nextNext = points[i + 2] || next;
        
        const cp1x = curr[0] + (next[0] - prev[0]) * 0.18;
        const cp1y = curr[1] + (next[1] - prev[1]) * 0.18;
        
        const cp2x = next[0] - (nextNext[0] - curr[0]) * 0.18;
        const cp2y = next[1] - (nextNext[1] - curr[1]) * 0.18;
        
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next[0]} ${next[1]}`;
    }
    return d;
}

function loadWatchlistView() {
    const grid = document.getElementById('watchlist-grid');
    grid.innerHTML = '';
    
    if (window.watchlistInterval) {
        clearInterval(window.watchlistInterval);
        window.watchlistInterval = null;
    }
    
    if (state.watchlist.length === 0) {
        grid.innerHTML = `
            <div class="col-span-4 py-16 text-center text-on-surface-variant font-label-sm">
                No assets in surveillance watchlist. Add tickers to monitor.
            </div>
        `;
        return;
    }
    
    const activePoints = {};
    
    state.watchlist.forEach(ticker => {
        const asset = state.assets[ticker];
        if (!asset) return;
        
        const isPositive = asset.change >= 0;
        const card = document.createElement('div');
        card.className = "group glass-panel p-5 rounded-xl flex flex-col justify-between hover:bg-white/10 transition-all cursor-pointer border border-white/5 active:translate-y-0.5 relative overflow-hidden";
        
        card.onclick = (e) => {
            if (e.target.closest('button')) return;
            window.location.hash = `#/stock/${ticker}`;
        };
        
        // Procedural points generation
        const points = generateProceduralPoints(ticker, asset.pctChange, asset.volatility);
        activePoints[ticker] = points;
        
        const d = getBezierPath(points);
        const lastPt = points[points.length - 1];
        const fillD = `${d} L ${lastPt[0]} 30 L 0 30 Z`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h5 class="font-bold text-sm text-white">${asset.symbol}</h5>
                    <p class="text-[10px] text-on-surface-variant truncate">${asset.name}</p>
                </div>
                <button onclick="toggleWatchlist('${ticker}')" class="p-1 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-error transition-colors" title="Delete Surveillance Target">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            </div>
            
            <!-- Procedural Mini Sparkline SVG -->
            <div class="h-12 my-3 relative">
                <svg class="w-full h-full" viewBox="0 0 100 30" fill="none">
                    <defs>
                        <linearGradient id="grad-${ticker}" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stop-color="${isPositive ? '#1FCA17' : '#ef4444'}" stop-opacity="0.25"></stop>
                            <stop offset="100%" stop-color="${isPositive ? '#1FCA17' : '#ef4444'}" stop-opacity="0"></stop>
                        </linearGradient>
                    </defs>
                    <!-- Background fill gradient -->
                    <path class="watchlist-sparkline-fill" id="sparkline-fill-${ticker}" d="${fillD}" fill="url(#grad-${ticker})" opacity="0.15" style="transition: opacity 0.5s ease;"></path>
                    <!-- Stroke path -->
                    <path class="watchlist-sparkline-path" id="sparkline-path-${ticker}" d="${d}" fill="none" stroke="${isPositive ? '#1FCA17' : '#ef4444'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="transition: d 0.5s ease-in-out, stroke-width 0.3s ease;"></path>
                    <!-- Hover Price Dot & Glow -->
                    <circle class="watchlist-sparkline-dot" id="sparkline-dot-${ticker}" cx="${lastPt[0]}" cy="${lastPt[1]}" r="3" fill="${isPositive ? '#1FCA17' : '#ef4444'}"></circle>
                    <circle class="watchlist-sparkline-dot watchlist-sparkline-dot-glow" id="sparkline-dot-glow-${ticker}" cx="${lastPt[0]}" cy="${lastPt[1]}" r="3.5" stroke="${isPositive ? '#1FCA17' : '#ef4444'}" stroke-width="1" fill="none"></circle>
                </svg>
            </div>
            
            <!-- Hover Micro Tooltip Overlay -->
            <div class="watchlist-tooltip absolute top-[4.5rem] left-1/2 transform -translate-x-1/2 bg-surface-container-high/95 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md text-[9px] font-label-sm text-on-surface opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl pointer-events-none z-10 flex gap-2">
                <span class="text-white font-bold">$${asset.price.toFixed(2)}</span>
                <span class="${isPositive ? 'text-tertiary' : 'text-error'}">${isPositive ? '+' : ''}${asset.pctChange.toFixed(2)}%</span>
                <span class="text-on-surface-variant">Vol: ${asset.volume}</span>
            </div>
            
            <div class="flex justify-between items-end mt-2">
                <div>
                    <p class="text-[10px] text-on-surface-variant font-label-sm">PRICE</p>
                    <p class="text-sm font-bold font-label-md text-white">$${asset.price.toFixed(2)}</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] text-on-surface-variant font-label-sm">24H CHANGE</p>
                    <span class="${isPositive ? 'text-tertiary' : 'text-error'} font-semibold text-xs font-label-md">
                        ${isPositive ? '+' : ''}${asset.pctChange.toFixed(2)}%
                    </span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    // Start Live Market simulation ticks (random walk on final point)
    window.watchlistInterval = setInterval(() => {
        state.watchlist.forEach(ticker => {
            const points = activePoints[ticker];
            const asset = state.assets[ticker];
            if (!points || !asset) return;
            
            const lastIdx = points.length - 1;
            const lastPt = points[lastIdx];
            
            // Generate a random market delta (-1.2 to +1.2 units)
            const delta = (Math.random() - 0.5) * 1.5;
            let newY = lastPt[1] + delta;
            
            // Bound inside SVG viewBox
            if (newY < 2) newY = 2;
            if (newY > 28) newY = 28;
            
            lastPt[1] = newY;
            
            const d = getBezierPath(points);
            const fillD = `${d} L ${points[lastIdx][0]} 30 L 0 30 Z`;
            
            // Inject directly to elements for fluid 60fps morph transitions
            const strokePath = document.getElementById(`sparkline-path-${ticker}`);
            const fillPath = document.getElementById(`sparkline-fill-${ticker}`);
            const dot = document.getElementById(`sparkline-dot-${ticker}`);
            const dotGlow = document.getElementById(`sparkline-dot-glow-${ticker}`);
            
            if (strokePath) strokePath.setAttribute('d', d);
            if (fillPath) fillPath.setAttribute('d', fillD);
            if (dot) dot.setAttribute('cy', newY);
            if (dotGlow) dotGlow.setAttribute('cy', newY);
        });
    }, 5000);
}

function addToWatchlistFromInput() {
    const input = document.getElementById('watchlist-add-input');
    const val = input.value.toUpperCase().trim();
    if (!val) return;
    
    if (!state.assets[val]) {
        showToast("Lookup Error", `Ticker ${val} is not cataloged in sandbox.`, "error");
        return;
    }
    
    if (state.watchlist.includes(val)) {
        showToast("Surveillance Duplicate", `${val} is already being monitored.`, "info");
        return;
    }
    
    state.watchlist.push(val);
    input.value = '';
    showToast("Surveillance Added", `${val} successfully added.`, "success");
    auditLog("Watchlist Add", `Added ${val} to watchlist`, "User");
    loadWatchlistView();
}
