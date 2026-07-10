// Comparative asset view controllers
function loadCompareView() {
    const body = document.getElementById('compare-table-body');
    body.innerHTML = '';
    
    state.comparisonTickers.forEach(ticker => {
        const asset = state.assets[ticker];
        if (!asset) return;
        
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer";
        row.onclick = (e) => {
            if (e.target.closest('button')) return;
            window.location.hash = `#/stock/${ticker}`;
        };
        
        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-white border border-white/10">${ticker[0]}</div>
                    <div>
                        <p class="font-bold text-white">${asset.symbol}</p>
                        <p class="text-[10px] text-on-surface-variant">${asset.name}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-center font-bold text-white">${asset.aiScore}</td>
            <td class="px-6 py-4 text-on-surface-variant font-label-sm">${asset.volatility}</td>
            <td class="px-6 py-4">
                <svg class="w-24 h-8" viewBox="0 0 100 30" fill="none">
                    <path d="M0 25 L 20 15 L 40 20 L 60 10 L 80 18 L 100 5" fill="none" stroke="#bfc2ff" stroke-width="1.5"></path>
                </svg>
            </td>
            <td class="px-6 py-4 font-label-md">${asset.mcap}</td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded text-[10px] font-label-sm ${
                    asset.sentiment === 'Bullish' ? 'bg-tertiary/10 text-tertiary border border-tertiary/30' : 'bg-error/10 text-error border border-error/30'
                }">
                    ${asset.sentiment}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="removeCompareAsset('${ticker}')" class="p-1 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-error transition-colors">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}

function addAssetToComparison() {
    const select = document.getElementById('compare-add-select');
    const val = select.value;
    if (state.comparisonTickers.includes(val)) {
        showToast("Comparison Duplicate", `${val} is already being compared.`, "info");
        return;
    }
    state.comparisonTickers.push(val);
    auditLog("Compare Add", `Added ${val} to comparative matrix`, "User");
    loadCompareView();
}

function removeCompareAsset(ticker) {
    state.comparisonTickers = state.comparisonTickers.filter(t => t !== ticker);
    auditLog("Compare Remove", `Removed ${ticker} from comparative matrix`, "User");
    loadCompareView();
}
