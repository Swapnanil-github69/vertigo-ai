// Portfolio holds and rebalancing controllers
function loadPortfolioView() {
    const body = document.getElementById('portfolio-holdings-body');
    body.innerHTML = '';
    
    state.portfolio.holdings.forEach(hold => {
        const asset = state.assets[hold.ticker];
        if (!asset) return;
        
        const curPrice = asset.price;
        const value = hold.shares * curPrice;
        const pnl = (curPrice - hold.avgCost) * hold.shares;
        const pnlPct = ((curPrice - hold.avgCost) / hold.avgCost) * 100;
        const isPositive = pnl >= 0;
        
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer";
        row.onclick = () => window.location.hash = `#/stock/${hold.ticker}`;
        row.innerHTML = `
            <td class="px-4 py-4 font-bold text-white">${asset.symbol}</td>
            <td class="px-4 py-4 font-label-md">${hold.shares.toLocaleString()}</td>
            <td class="px-4 py-4 font-label-md">$${hold.avgCost.toFixed(2)}</td>
            <td class="px-4 py-4 font-label-md">$${curPrice.toFixed(2)}</td>
            <td class="px-4 py-4 font-bold text-white font-label-md">$${value.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-4 font-semibold font-label-md ${isPositive ? 'text-tertiary' : 'text-error'}">
                ${isPositive ? '+' : ''}$${pnl.toLocaleString(undefined, {minimumFractionDigits: 2})} (${isPositive ? '+' : ''}${pnlPct.toFixed(2)}%)
            </td>
            <td class="px-4 py-4 text-right font-bold text-white font-label-md">${hold.alloc}%</td>
        `;
        body.appendChild(row);
    });
    updateRebalanceDisplay();
}

function updateRebalanceDisplay() {
    const tech = document.getElementById('rebalance-range-tech').value;
    const crypto = document.getElementById('rebalance-range-crypto').value;
    const auto = document.getElementById('rebalance-range-auto').value;
    
    document.getElementById('rebalance-val-tech').innerText = `${tech}%`;
    document.getElementById('rebalance-val-crypto').innerText = `${crypto}%`;
    document.getElementById('rebalance-val-auto').innerText = `${auto}%`;
}

function recalculateOptimizer() {
    showToast("AI Rebalancer Run", "Optimizing risk-adjusted weights...", "info");
    
    setTimeout(() => {
        const tech = parseInt(document.getElementById('rebalance-range-tech').value);
        const crypto = parseInt(document.getElementById('rebalance-range-crypto').value);
        const auto = parseInt(document.getElementById('rebalance-range-auto').value);
        const sum = tech + crypto + auto;
        
        if (sum > 100) {
            showToast("Optimization Alert", "Total weights exceed 100%. Re-scaling limit allocations.", "error");
            return;
        }
        
        // Re-allocate target limits
        state.portfolio.holdings[0].alloc = tech;
        state.portfolio.holdings[1].alloc = crypto;
        state.portfolio.holdings[2].alloc = auto;
        state.portfolio.holdings[3].alloc = 100 - sum; // AAPL gets remainder
        
        auditLog("Portfolio Rebalance", `AI adjusted target allocations: Tech ${tech}%, Crypto ${crypto}%, Auto ${auto}%`, "AI Engine");
        showToast("Portfolio Optimized", "Risk coefficients re-scaled. Beta decreased to 0.89β.", "success");
        loadPortfolioView();
    }, 800);
}
