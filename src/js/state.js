// Global reactive app state
const state = {
    loggedIn: false,
    user: {
        name: "Alex Vance",
        email: "alex.vance@vertigo.ai",
        tier: "Enterprise Tier",
        apiKeys: [
            { id: 1, value: "vt_live_58c2a4c172d5b6e792e8", created: "2026-06-12", status: "Active" }
        ]
    },
    activeStock: "NVDA",
    watchlist: ["NVDA", "AAPL", "BTC.X", "TSLA"],
    alerts: [
        { id: 1, ticker: "NVDA", type: "Price Above", condition: "Above $135.00", status: "Active", created: "10 mins ago" },
        { id: 2, ticker: "BTC.X", type: "Volatility Spike", condition: "30D Vol > 2.5σ", status: "Active", created: "2 hours ago" },
        { id: 3, ticker: "TSLA", type: "Sentiment Shift", condition: "Sentiment Bearish", status: "Active", created: "1 day ago" }
    ],
    logs: [
        { time: "09:24:12", action: "User Session Init", detail: "Loaded public marketing portal - IP: 192.168.1.108", type: "System" },
        { time: "09:21:05", action: "Public Inquiry", detail: "Read features methodology - Nodes synchronized", type: "System" }
    ],
    chatMessages: [
        { sender: "ai", text: "Welcome to **Vertigo's Investment Copilot**. I have analyzed your portfolio. It currently has a health score of **88/100** with high exposure to technology (55%). What analysis would you like to perform today?" }
    ],
    assets: {
        "NVDA": {
            symbol: "NVDA.US",
            name: "NVIDIA Corp.",
            sector: "Technology | AI Semiconductors",
            price: 127.40,
            change: 5.20,
            pctChange: 4.25,
            aiScore: 96,
            volatility: "1.21σ (Moderate)",
            beta: "1.84β (High)",
            sentiment: "Bullish",
            mcap: "$3.13T",
            pe: "74.2",
            range: "$82.40 - $140.76",
            volume: "42.5M",
            chartPath: "M0 120 L50 90 L100 110 L150 70 L200 85 L250 40 L300 65 L350 20 L400 35 L450 15 L500 20",
            recommendation: "NVDA continues to showcase strong transformer-driven correlation signals. Blackwell tape-out recovery yields support an upward vector towards $145.00.",
            news: [
                { headline: "TSMC yield recoveries spur Blackwell shipments", source: "Intelligence Feed", age: "5 mins ago", impact: "High positive" },
                { headline: "Institutional accumulation vectors increase for GPU clusters", source: "SEC AI Crawler", age: "2 hours ago", impact: "Positive" }
            ]
        },
        "AAPL": {
            symbol: "AAPL.US",
            name: "Apple Inc.",
            sector: "Technology | Hardware & software",
            price: 210.60,
            change: 3.75,
            pctChange: 1.81,
            aiScore: 89,
            volatility: "0.84σ (Low)",
            beta: "1.12β (Moderate)",
            sentiment: "Bullish",
            mcap: "$3.25T",
            pe: "28.5",
            range: "$165.00 - $220.20",
            volume: "35.2M",
            chartPath: "M0 100 L50 95 L100 80 L150 85 L200 70 L250 75 L300 60 L350 55 L400 45 L450 35 L500 40",
            recommendation: "Apple's neural upgrade cycle presents a massive catalyst. Our vectors suggest a 12% upside in the next 90 days as AI integrations deploy to standard consumers.",
            news: [
                { headline: "Apple Intelligence beta logs high developer engagement", source: "GitHub Scraping Node", age: "30 mins ago", impact: "Positive" },
                { headline: "iPhone 16 supply chain revisions indicate initial order hikes", source: "Supply Chain Node", age: "4 hours ago", impact: "Moderate positive" }
            ]
        },
        "MSFT": {
            symbol: "MSFT.US",
            name: "Microsoft Corp.",
            sector: "Technology | Enterprise Cloud & AI",
            price: 415.50,
            change: 3.70,
            pctChange: 0.90,
            aiScore: 85,
            volatility: "0.52σ (Low)",
            beta: "0.95β (Low)",
            sentiment: "Bullish",
            mcap: "$3.09T",
            pe: "36.4",
            range: "$340.00 - $430.80",
            volume: "21.8M",
            chartPath: "M0 90 L50 85 L100 90 L150 80 L200 85 L250 70 L300 75 L350 65 L400 70 L450 60 L500 62",
            recommendation: "Azure OpenAI scaling continues to command enterprise market share. Capital deployment vectors indicate stable margins and multi-year contract renewals.",
            news: [
                { headline: "Azure expands datacenter capacity in EMEA region", source: "Press Releases Parser", age: "1 hour ago", impact: "Neutral" },
                { headline: "Office 365 Copilot pricing adjustments yield 8% margin uplift", source: "Analyst Audit", age: "5 hours ago", impact: "Positive" }
            ]
        },
        "TSLA": {
            symbol: "TSLA.US",
            name: "Tesla Motors",
            sector: "Automotive | Energy & Autonomous",
            price: 174.50,
            change: -4.30,
            pctChange: -2.40,
            aiScore: 58,
            volatility: "1.92σ (High)",
            beta: "1.52β (High)",
            sentiment: "Bearish",
            mcap: "$554.2B",
            pe: "54.8",
            range: "$138.80 - $271.00",
            volume: "82.4M",
            chartPath: "M0 50 L50 60 L100 45 L150 65 L200 80 L250 70 L300 95 L350 110 L400 90 L450 120 L500 125",
            recommendation: "TSLA is experiencing negative sentiment drag from regulatory oversight on FSD. Accumulation vectors are currently flat; suggest holding until volatility dampens.",
            news: [
                { headline: "FSD regulatory compliance review extended to Q4", source: "Federal Registry Parser", age: "3 hours ago", impact: "Negative" },
                { headline: "Giga Shanghai export numbers show 5% MoM consolidation", source: "Customs Registry", age: "1 day ago", impact: "Moderate negative" }
            ]
        },
        "BTC.X": {
            symbol: "BTC.X",
            name: "Bitcoin",
            sector: "Cryptocurrency | Decentralized Asset",
            price: 68400.00,
            change: 812.00,
            pctChange: 1.20,
            aiScore: 72,
            volatility: "2.41σ (High)",
            beta: "1.10β (Moderate)",
            sentiment: "Neutral",
            mcap: "$1.34T",
            pe: "N/A",
            range: "$38,500 - $73,800",
            volume: "28.5B",
            chartPath: "M0 120 L50 80 L100 95 L150 60 L200 75 L250 90 L300 50 L350 40 L400 65 L450 30 L500 28",
            recommendation: "Bitcoin consolidates below cycle resistance. ETF inflows support structural base, but short-term volatility ranges remain elevated.",
            news: [
                { headline: "Institutional spot inflows exceed $400M in 48h", source: "Onchain Tracker", age: "12 hours ago", impact: "Positive" },
                { headline: "Mining difficulty adjustment pushes production costs to $52k", source: "ASIC Tracker Node", age: "1 day ago", impact: "Neutral" }
            ]
        }
    },
    portfolio: {
        holdings: [
            { ticker: "NVDA", shares: 615, avgCost: 95.00, value: 78351.00, pnl: 19926.00, alloc: 55 },
            { ticker: "BTC.X", shares: 0.312, avgCost: 58000.00, value: 21340.80, pnl: 3244.80, alloc: 15 },
            { ticker: "TSLA", shares: 122, avgCost: 190.00, value: 21289.00, pnl: -1891.00, alloc: 15 },
            { ticker: "AAPL", shares: 101, avgCost: 185.00, value: 21270.60, pnl: 2585.60, alloc: 15 }
        ]
    },
    reports: [
        { id: 1, name: "NVDA_Equity_Intelligence_Report.pdf", size: "2.4 MB", date: "2026-07-10 08:30" },
        { id: 2, name: "Portfolio_Risk_Assessment_Q3.pdf", size: "4.1 MB", date: "2026-07-09 14:15" }
    ],
    scannedOpportunities: [
        { ticker: "NVDA.US", score: 96, signal: "Strong Buy", price: "$127.40", change: "+4.2%", catalyst: "Blackwell tape-out recovery yields", status: "Bullish" },
        { ticker: "AAPL.US", score: 89, signal: "Buy", price: "$210.60", change: "+1.8%", catalyst: "AI device cycle upgrades", status: "Bullish" },
        { ticker: "MSFT.US", score: 85, signal: "Buy", price: "$415.50", change: "+0.9%", catalyst: "Azure OpenAI capacity scaling", status: "Bullish" },
        { ticker: "BTC.X", score: 72, signal: "Buy", price: "$68,400", change: "+1.2%", catalyst: "Spot ETF net inflows", status: "Neutral" },
        { ticker: "TSLA.US", score: 58, signal: "Hold", price: "$174.50", change: "-2.4%", catalyst: "FSD regulatory timeline extension", status: "Neutral" }
    ],
    comparisonTickers: ["NVDA", "BTC.X", "TSLA"]
};

// System Toasts Utility
function showToast(title, msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast max-w-sm pointer-events-auto rounded-xl p-4 border flex gap-3 shadow-xl ${
        type === 'success' ? 'bg-surface-container border-tertiary/20 text-on-surface' :
        type === 'error' ? 'bg-surface-container border-error/20 text-on-surface' : 'bg-surface-container border-white/10 text-on-surface'
    }`;
    
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'cancel' : 'info';
    const iconColor = type === 'success' ? 'text-tertiary' : type === 'error' ? 'text-error' : 'text-secondary';
    
    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor}">${icon}</span>
        <div>
            <h5 class="font-bold text-xs text-white">${title}</h5>
            <p class="text-[11px] text-on-surface-variant mt-0.5">${msg}</p>
        </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add action to Security Audit logs
function auditLog(action, detail, type = "User") {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    state.logs.unshift({ time, action, detail, type });
    if (state.logs.length > 50) state.logs.pop(); // keep logs clean
    // If logs view is active, update it
    if (window.location.hash === '#/logs') {
        loadLogsTable();
    }
}

// Global JWT Access Token storage
let accessToken = localStorage.getItem('accessToken') || null;

// Unified HTTP request helper
const BACKEND_URL = window.location.port === '3000' ? 'http://localhost:8000' : '';

async function apiFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Automatically serialize object bodies to JSON
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    
    options.credentials = 'include'; // Include cookies (refreshToken)

    try {
        const response = await fetch(BACKEND_URL + url, options);
        
        let json = {};
        try {
            json = await response.json();
        } catch (e) {
            // response was empty or not JSON
        }
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                if (state.loggedIn) {
                    accessToken = null;
                    localStorage.removeItem('accessToken');
                    state.loggedIn = false;
                    showToast("Session Expired", "Please log in again to continue.", "error");
                    window.location.hash = '#/auth';
                }
            }
            const errMsg = json.message || `API request failed with status ${response.status}`;
            throw new Error(errMsg);
        }
        return json;
    } catch (err) {
        if (err.message === 'Failed to fetch') {
            showToast("Network Error", "Connection to server failed. Please check your connection.", "error");
        }
        throw err;
    }
}

// Retrying fetch utility with exponential backoff
async function apiFetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    try {
        return await apiFetch(url, options);
    } catch (err) {
        if (retries > 0) {
            console.warn(`⚠️ [API Retry] Failed to connect to ${url}. Retrying in ${delay}ms... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return apiFetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw err;
    }
}

async function fetchLiveQuotesForAssets() {
    const symbols = Object.keys(state.assets);
    try {
        const promises = symbols.map(async (ticker) => {
            try {
                const res = await apiFetch(`/api/stocks/quote?symbol=${ticker}`);
                if (res.success && res.data) {
                    const quote = res.data;
                    const asset = state.assets[ticker];
                    if (asset) {
                        asset.price = Number(quote.price);
                        asset.change = Number(quote.change);
                        asset.pctChange = Number(quote.changePercent);
                        asset.high = Number(quote.high);
                        asset.low = Number(quote.low);
                        asset.open = Number(quote.open);
                        asset.previousClose = Number(quote.previousClose);
                        if (quote.volume) {
                            const vol = Number(quote.volume);
                            if (vol >= 1000000000) {
                                asset.volume = (vol / 1000000000).toFixed(1) + 'B';
                            } else if (vol >= 1000000) {
                                asset.volume = (vol / 1000000).toFixed(1) + 'M';
                            } else {
                                asset.volume = vol.toLocaleString();
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Failed to fetch quote for ${ticker}:`, err);
            }
        });
        await Promise.all(promises);
    } catch (e) {
        console.error("fetchLiveQuotesForAssets global error:", e);
    }
}

