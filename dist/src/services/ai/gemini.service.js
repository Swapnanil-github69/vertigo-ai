"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiService = exports.GeminiService = void 0;
class GeminiService {
    apiKey;
    model = 'gemini-2.5-flash';
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
    }
    async generateChatResponse(history, message) {
        if (!this.apiKey || this.apiKey === 'dummy_key' || this.apiKey.trim() === '') {
            return this.generateMockResponse(message);
        }
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const systemPrompt = `You are the Vertigo AI Investment Copilot, a premium, institutional-grade financial analyst assistant. 
You provide clear, objective, data-driven financial advice, portfolio calculations, risk assessments, and asset comparison insights.
Format all responses in beautiful, clean Markdown with bullet points, bold markers, and structured layout. Do not refer to yourself as an LLM. 
Remain highly professional, concise, and mathematically rigorous.

Active tracked assets details for context:
- NVDA (NVIDIA Corp.): price ~$900.20, Bullish.
- AAPL (Apple Inc.): price ~$180.50, Bullish.
- MSFT (Microsoft Corp.): price ~$420.10, Bullish.
- TSLA (Tesla Inc.): price ~$175.40, Consolidation.
- BTC.X (Bitcoin USD): price ~$65000.00, High Volatility.`;
            const contents = [];
            for (const h of history) {
                contents.push({
                    role: h.role === 'model' ? 'model' : 'user',
                    parts: [{ text: h.text }],
                });
            }
            contents.push({
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
            });
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents }),
            });
            if (!response.ok) {
                throw new Error(`Gemini API returned status ${response.status}`);
            }
            const resJson = (await response.json());
            const candidates = resJson.candidates || [];
            if (candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
                return candidates[0].content.parts[0].text;
            }
            throw new Error('Invalid response structure from Gemini API');
        }
        catch (err) {
            console.error('Gemini call failed, invoking fallback mockup engine:', err);
            return this.generateMockResponse(message);
        }
    }
    generateMockResponse(message) {
        const cleanMsg = message.toLowerCase();
        if (cleanMsg.includes('portfolio') || cleanMsg.includes('allocation') || cleanMsg.includes('rebal')) {
            return `### Vertigo AI Portfolio Analysis

Our quantitative engine has performed a real-time vector audit on your **Primary Portfolio** ($100k sandbox cash):
*   **Asset Coverage**: Heavy concentration in Tech sectors (**NVDA**, **AAPL**, **MSFT**) constituting **55%** of allocations.
*   **Risk Vector (Beta)**: Current systemic beta stands at **1.42β** (High sensitivity to Nasdaq fluctuations).
*   **Recommendation**:
    1.  Consider rebalancing **TSLA** and **BTC.X** (Cryptocurrency limit at 15%) to lock in short-term gains.
    2.  Hedge high-beta semiconductors by distributing **5%** into cash reserves or treasury indices.`;
        }
        if (cleanMsg.includes('aapl') || cleanMsg.includes('apple')) {
            return `### Apple Inc. (AAPL) Intelligence Assessment

*   **Market Price**: $180.50 (Synced)
*   **AI Score**: **89 / 100** (Strong Accumulation)
*   **Catalysts**:
    *   **Apple Intelligence deployment** creates a multi-quarter consumer upgrade cycle.
    *   Strong supply chain adjustments indicate double-digit order growth in Asian semiconductor manufacturing nodes.
*   **Recommendation**: **OVERWEIGHT**. Targets set at **$215.00** with support bounds at **$172.00**.`;
        }
        if (cleanMsg.includes('nvda') || cleanMsg.includes('nvidia')) {
            return `### NVIDIA Corp. (NVDA) Intelligence Assessment

*   **Market Price**: $900.20 (Synced)
*   **AI Score**: **96 / 100** (High Conviction Leader)
*   **Catalysts**:
    *   **Blackwell GPU yield corrections** in TSMC foundries are accelerating bulk enterprise shipments.
    *   Datacenter capital expenditures among major clouds (MSFT, GOOG, AMZN) continue to print double-digit growth.
*   **Recommendation**: **ACCUMULATE**. Current upward momentum aligns with a target vector of **$980.00**.`;
        }
        if (cleanMsg.includes('btc') || cleanMsg.includes('bitcoin') || cleanMsg.includes('crypto')) {
            return `### Bitcoin USD (BTC.X) Cryptographic Intelligence

*   **Market Price**: $65,000.00
*   **AI Score**: **74 / 100** (High Volatility Alpha)
*   **Metrics**:
    *   **30D Volatility Index**: **2.82σ** (Spike state)
    *   **Moving Average Convergence**: Standard bullish cross printed on weekly candles.
*   **Recommendation**: **HOLD**. Expect consolidation between **$62,000** and **$68,000** before the next macro breakout catalyst.`;
        }
        return `### Vertigo AI Copilot Response

I have analyzed your query: *"${message}"*.
Here is the tactical intelligence breakdown:
1.  **Macro Climate**: Federal interest rate paths continue to support high-growth technology equities over yield instruments.
2.  **Sentiment Vector**: Institutional holdings show active transition towards AI-integrated infrastructure assets.
3.  **Surveillance Alert**: Monitor NVDA price action closely as it approaches structural resistance.

How would you like to update your strategy parameters? You can ask me to *Analyze my portfolio health*, *Compare AAPL and TSLA*, or request stock specific catalysts.`;
    }
}
exports.GeminiService = GeminiService;
exports.geminiService = new GeminiService();
exports.default = exports.geminiService;
