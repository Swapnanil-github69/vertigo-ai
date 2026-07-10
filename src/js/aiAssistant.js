// AI Assistant Copilot chat controllers
function loadChatHistory() {
    const container = document.getElementById('chat-messages-container');
    container.innerHTML = '';
    
    state.chatMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`;
        
        // Render bold text
        let formattedText = msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        div.innerHTML = `
            <div class="max-w-[75%] rounded-xl p-4 text-xs shadow-md border ${
                msg.sender === 'user' ? 
                'bg-secondary-container/20 border-secondary/20 text-white rounded-br-none' : 
                'bg-surface-container/50 border-white/5 text-on-surface-variant rounded-bl-none leading-relaxed'
            }">
                ${formattedText}
            </div>
        `;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage(text) {
    if (!text.trim()) return;
    
    // Add user prompt
    state.chatMessages.push({ sender: "user", text });
    loadChatHistory();
    auditLog("AI Copilot Message", `Sent prompt: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`, "User");
    
    // Show typing loader
    const container = document.getElementById('chat-messages-container');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = "flex justify-start id-typing-indicator";
    typingIndicator.innerHTML = `
        <div class="bg-surface-container/50 border border-white/5 rounded-xl rounded-bl-none p-4 text-xs text-on-surface-variant flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></span>
            <span class="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]"></span>
            <span class="italic text-[10px] opacity-70">Vertigo AI decoding vectors...</span>
        </div>
    `;
    container.appendChild(typingIndicator);
    container.scrollTop = container.scrollHeight;
    
    // Formulate answer
    setTimeout(() => {
        typingIndicator.remove();
        
        let response = "I am Vertigo's neural intelligence agent. I can perform deep-dive financial analysis, generate investment reports, scan for market anomalies, or audit your portfolio's risk exposure. Let me know what you'd like to analyze.";
        const query = text.toLowerCase();
        
        if (query.includes('aapl') || query.includes('apple')) {
            response = "Apple Inc. (AAPL) currently holds an **AI Score of 89/100**. The primary catalyst is the acceleration of the on-device AI upgrade cycle. Resistance is at $215.00, with support solidifying at $205.00. Our models maintain a **Buy** conviction.";
        } else if (query.includes('portfolio') || query.includes('health') || query.includes('risk')) {
            response = "Your portfolio health score is **88/100 (Excellent)**. We detect high sector concentration in Technology (55%). Consider rebalancing or adding cash reserves to insulate against macro interest rate revisions.";
        } else if (query.includes('compare')) {
            response = "Comparing **AAPL (AI Score: 89)** and **TSLA (AI Score: 58)**: AAPL shows strong sentiment and low volatility (0.84σ). TSLA has bearish sentiment due to FSD regulatory delay drag and higher volatility (1.92σ). Our neural vectors favor AAPL for long-term growth and lower tail risk.";
        } else if (query.includes('scan') || query.includes('opportunity') || query.includes('outperform')) {
            response = "Our Opportunity Scanner indicates that **NVIDIA (NVDA)** leads coverage with an AI Score of 96. Other breakouts include Apple (AAPL - Score 89) and Microsoft (MSFT - Score 85). We suggest reviewing the Alerts Page to track key volatility signals.";
        } else if (query.includes('hi') || query.includes('hello')) {
            response = `Hello, ${state.user.name.split(' ')[0]}. Investment Copilot online. How can I assist with your portfolio analysis or asset comparisons today?`;
        }
        
        state.chatMessages.push({ sender: "ai", text: response });
        loadChatHistory();
        auditLog("AI Copilot Response", "Generated neural intelligence reply", "AI Engine");
    }, 1200);
}

function handleChatSubmit(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('chat-input');
        const val = input.value;
        if (!val.trim()) return;
        sendChatMessage(val);
        input.value = '';
    }
}

function handleChatSendBtn() {
    const input = document.getElementById('chat-input');
    const val = input.value;
    if (!val.trim()) return;
    sendChatMessage(val);
    input.value = '';
}
