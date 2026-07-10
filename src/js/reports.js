// Reports view controllers
function loadReportsView() {
    const body = document.getElementById('reports-table-body');
    body.innerHTML = '';
    
    state.reports.forEach(rep => {
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 border-b border-white/5 transition-colors";
        row.innerHTML = `
            <td class="px-4 py-4 font-bold text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-error text-lg">picture_as_pdf</span>
                <span>${rep.name}</span>
            </td>
            <td class="px-4 py-4 text-on-surface-variant font-label-sm">${rep.size}</td>
            <td class="px-4 py-4 text-on-surface-variant">${rep.date}</td>
            <td class="px-4 py-4 text-right">
                <button onclick="downloadReportMock('${rep.name}')" class="p-1.5 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-white transition-colors" title="Download Report">
                    <span class="material-symbols-outlined text-sm">download</span>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}

function triggerReportGeneration() {
    const asset = document.getElementById('report-asset-select').value;
    const type = document.getElementById('report-type-select').value;
    
    const btn = document.getElementById('report-gen-btn');
    const panel = document.getElementById('report-progress-panel');
    const bar = document.getElementById('report-progress-bar');
    const text = document.getElementById('report-progress-text');
    const pct = document.getElementById('report-progress-pct');
    
    btn.disabled = true;
    panel.classList.remove('hidden');
    bar.style.width = '0%';
    pct.innerText = '0%';
    
    const checkpoints = [
        { progress: 20, msg: "Gathering fundamental records..." },
        { progress: 50, msg: "Executing sentiment calculations..." },
        { progress: 80, msg: "Formatting PDF document vectors..." },
        { progress: 100, msg: "Finalizing signature hash..." }
    ];
    
    let checkpointIdx = 0;
    let currentPct = 0;
    
    const interval = setInterval(() => {
        currentPct += 5;
        bar.style.width = `${currentPct}%`;
        pct.innerText = `${currentPct}%`;
        
        if (checkpointIdx < checkpoints.length && currentPct >= checkpoints[checkpointIdx].progress) {
            text.innerText = checkpoints[checkpointIdx].msg;
            checkpointIdx++;
        }
        
        if (currentPct >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                panel.classList.add('hidden');
                btn.disabled = false;
                
                const date = new Date().toISOString().replace('T', ' ').substring(0, 16);
                const reportName = `${asset}_${type.replace(/\s+/g, '_')}_Report.pdf`;
                state.reports.unshift({
                    id: state.reports.length + 1,
                    name: reportName,
                    size: "3.1 MB",
                    date
                });
                
                showToast("Report Generated", `${reportName} added to dossiers.`, "success");
                auditLog("Report Compiled", `Generated PDF audit dossier for ${asset}`, "User");
                loadReportsView();
            }, 500);
        }
    }, 100);
}

function downloadReportMock(name) {
    showToast("Downloading File", `Initiated download for ${name}.`, "info");
    auditLog("File Download", `Downloaded dossier report: ${name}`, "User");
}
