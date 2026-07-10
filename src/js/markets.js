// Markets table rendering controllers
let currentMarketsSector = 'ALL';

function setMarketsSectorFilter(sector) {
    currentMarketsSector = sector;
    document.querySelectorAll('.market-filter-btn').forEach(btn => {
        btn.className = "market-filter-btn px-4 py-2.5 text-xs text-on-surface-variant hover:text-white font-medium";
    });
    const activeBtn = document.getElementById(`market-btn-${sector}`);
    if (activeBtn) activeBtn.className = "market-filter-btn px-4 py-2.5 text-xs bg-white/10 text-white font-semibold";
    
    filterMarketsTable();
}

function filterMarketsTable() {
    const term = document.getElementById('market-search-input').value.toLowerCase();
    const body = document.getElementById('markets-table-body');
    body.innerHTML = '';
    
    Object.keys(state.assets).forEach(key => {
        const asset = state.assets[key];
        
        // Sector check
        if (currentMarketsSector !== 'ALL') {
            if (currentMarketsSector === 'Tech' && !asset.sector.includes('Technology')) return;
            if (currentMarketsSector === 'Auto' && !asset.sector.includes('Automotive')) return;
            if (currentMarketsSector === 'Crypto' && !asset.sector.includes('Cryptocurrency')) return;
        }
        
        // Search term check
        const nameMatch = asset.name.toLowerCase().includes(term);
        const tickerMatch = asset.symbol.toLowerCase().includes(term);
        if (!nameMatch && !tickerMatch) return;
        
        const isPositive = asset.change >= 0;
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer";
        row.onclick = (e) => {
            if (e.target.closest('button')) return;
            window.location.hash = `#/stock/${key}`;
        };
        
        row.innerHTML = `
            <td class="px-6 py-4 font-bold text-white">${asset.symbol}</td>
            <td class="px-6 py-4 text-on-surface">${asset.name}</td>
            <td class="px-6 py-4 text-on-surface-variant">${asset.sector.split('|')[0].trim()}</td>
            <td class="px-6 py-4 font-label-md">$${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td class="px-6 py-4 font-semibold font-label-md ${isPositive ? 'text-tertiary' : 'text-error'}">
                ${isPositive ? '+' : ''}${asset.pctChange.toFixed(2)}%
            </td>
            <td class="px-6 py-4 text-center font-bold text-white">${asset.aiScore}</td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded text-[10px] font-label-sm ${
                    asset.aiScore >= 90 ? 'bg-tertiary/10 text-tertiary border border-tertiary/30' :
                    asset.aiScore >= 70 ? 'bg-secondary/10 text-secondary border border-secondary/30' :
                    'bg-error/10 text-error border border-error/30'
                }">
                    ${asset.aiScore >= 90 ? 'Strong Buy' : asset.aiScore >= 70 ? 'Buy' : 'Hold'}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="toggleWatchlist('${key}')" class="p-1.5 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-white transition-colors mr-2" title="Toggle Watchlist">
                    <span class="material-symbols-outlined text-sm">${state.watchlist.includes(key) ? 'bookmark_added' : 'bookmark'}</span>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}
