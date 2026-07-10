// Stock details view controllers
let tvChartInstance = null;

async function loadStockDetails(ticker) {
    state.activeStock = ticker;
    
    // Set loading placeholder state
    document.getElementById('stock-detail-symbol').innerText = ticker + " (Syncing...)";

    try {
        const [quoteRes, profileRes] = await Promise.all([
            apiFetch(`/api/stocks/quote?symbol=${ticker}`),
            apiFetch(`/api/stocks/profile?symbol=${ticker}`)
        ]);

        if (quoteRes.success && profileRes.success) {
            const q = quoteRes.data;
            const p = profileRes.data;

            if (!state.assets[ticker]) {
                state.assets[ticker] = {};
            }
            const asset = state.assets[ticker];
            
            // Map live values
            asset.price = q.price;
            asset.change = q.change;
            asset.pctChange = q.changePercent;
            asset.volume = (q.volume / 1000000).toFixed(1) + 'M';
            asset.open = q.open;
            asset.high = q.high;
            asset.low = q.low;
            asset.range = `$${q.low.toFixed(2)} - $${q.high.toFixed(2)}`;

            asset.name = p.name;
            asset.sector = `${p.sector} | ${p.industry}`;
            asset.symbol = p.symbol;
            
            // Seed placeholder metrics if not present
            if (!asset.aiScore) asset.aiScore = Math.floor(65 + (q.price % 30));
            if (!asset.volatility) asset.volatility = (1.1 + (q.price % 3) / 10).toFixed(2) + "σ (Moderate)";
            if (!asset.beta) asset.beta = (0.9 + (q.price % 5) / 10).toFixed(2) + "β";
            if (!asset.sentiment) asset.sentiment = q.changePercent >= 0 ? "Bullish" : "Bearish";
            if (!asset.recommendation) {
                asset.recommendation = `${p.name} exhibits positive momentum vectors above moving averages. Neural targets set to $${(q.price * 1.12).toFixed(2)}.`;
            }
            
            asset.mcap = `$${(1.2 + (q.price % 10) / 10).toFixed(2)}T`;
            asset.pe = (22 + (q.price % 20)).toFixed(1);
            
            if (!asset.news) {
                asset.news = [
                    { headline: `${p.name} sentiment indices register positive momentum`, source: "SEC AI Crawler", age: "5 mins ago", impact: "Moderate positive" },
                    { headline: `${p.name} quarterly earnings projected parameters updated`, source: "Analyst Audit", age: "2 hours ago", impact: "Neutral" }
                ];
            }
        }
    } catch (err) {
        console.error("Failed to sync live stock details:", err);
    }

    const asset = state.assets[ticker];
    if (!asset) {
        window.location.hash = '#/dashboard';
        return;
    }
    
    // Set UI elements
    document.getElementById('stock-detail-avatar').innerText = ticker[0];
    document.getElementById('stock-detail-name').innerText = asset.name;
    document.getElementById('stock-detail-symbol').innerText = asset.symbol;
    document.getElementById('stock-detail-sector').innerText = asset.sector;
    document.getElementById('stock-detail-price').innerText = `$${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    
    const isPositive = asset.change >= 0;
    const changeNode = document.getElementById('stock-detail-change');
    changeNode.className = `text-xs font-label-md flex items-center justify-end mt-0.5 ${isPositive ? 'text-tertiary' : 'text-error'}`;
    changeNode.innerHTML = `<span class="material-symbols-outlined text-sm mr-0.5">${isPositive ? 'trending_up' : 'trending_down'}</span>${isPositive ? '+' : ''}${asset.change.toFixed(2)} (${isPositive ? '+' : ''}${asset.pctChange.toFixed(2)}%)`;
    
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
    
    // Render TradingView interactive chart
    renderTradingViewChart(ticker);
    
    // Render news feed
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

async function renderTradingViewChart(ticker) {
    const container = document.getElementById('stock-detail-tv-chart');
    if (!container) return;

    if (tvChartInstance) {
        tvChartInstance.remove();
        tvChartInstance = null;
    }

    try {
        const res = await apiFetch(`/api/stocks/history?symbol=${ticker}&outputsize=60`);
        if (!res.success || !res.data || res.data.length === 0) {
            container.innerHTML = `<div class="text-on-surface-variant text-center py-20 italic">No historical price vectors available.</div>`;
            return;
        }

        const dataPoints = res.data;
        const isUp = dataPoints[dataPoints.length - 1].close >= dataPoints[0].close;
        const strokeColor = isUp ? '#1FCA17' : '#ef4444';

        const activeTheme = localStorage.getItem('theme') || 'dark';
        const isDark = activeTheme === 'dark';

        tvChartInstance = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight || 256,
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: isDark ? '#94A3B8' : '#475569',
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)' },
                horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
            },
        });

        const areaSeries = tvChartInstance.addAreaSeries({
            lineColor: strokeColor,
            topColor: strokeColor + '30',
            bottomColor: 'rgba(0,0,0,0)',
            lineWidth: 2,
        });

        const chartData = dataPoints.map(p => ({
            time: p.time,
            value: p.close
        }));

        areaSeries.setData(chartData);
        tvChartInstance.timeScale().fitContent();

        // Responsive resize
        const resizeObserver = new ResizeObserver(() => {
            if (tvChartInstance && container) {
                tvChartInstance.resize(container.clientWidth, container.clientHeight);
            }
        });
        resizeObserver.observe(container);

    } catch (err) {
        console.error("Failed to render TradingView chart:", err);
        container.innerHTML = `<div class="text-error text-center py-20 italic">Failed to initialize chart engine.</div>`;
    }
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
    if (window.location.hash === '#/watchlist') {
        typeof loadWatchlistView === 'function' && loadWatchlistView();
    }
}
