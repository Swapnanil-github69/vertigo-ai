"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwelveDataProvider = void 0;
class TwelveDataProvider {
    apiKey;
    baseUrl = 'https://api.twelvedata.com';
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async getQuote(symbol) {
        const res = await fetch(`${this.baseUrl}/quote?symbol=${symbol}&apikey=${this.apiKey}`);
        if (!res.ok)
            throw new Error('Twelve Data quote fetch failed');
        const data = (await res.json());
        if (data.status === 'error')
            throw new Error(data.message);
        return {
            symbol: data.symbol,
            price: parseFloat(data.close),
            change: parseFloat(data.change),
            changePercent: parseFloat(data.percent_change),
            high: parseFloat(data.high),
            low: parseFloat(data.low),
            open: parseFloat(data.open),
            previousClose: parseFloat(data.previous_close),
            volume: parseInt(data.volume),
            timestamp: new Date(parseInt(data.timestamp) * 1000),
        };
    }
    async getProfile(symbol) {
        const res = await fetch(`${this.baseUrl}/profile?symbol=${symbol}&apikey=${this.apiKey}`);
        if (!res.ok)
            throw new Error('Twelve Data profile fetch failed');
        const data = (await res.json());
        return {
            symbol: symbol,
            name: data.name || symbol,
            exchange: data.exchange || 'NASDAQ',
            sector: data.sector || 'Technology',
            industry: data.industry || 'Consumer Services',
            description: data.description || `${symbol} common stock profile.`,
            logo: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
            weburl: `https://www.${symbol.toLowerCase()}.com`,
        };
    }
    async getHistory(symbol, interval = '1day', outputsize = 30) {
        const res = await fetch(`${this.baseUrl}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${this.apiKey}`);
        if (!res.ok)
            throw new Error('Twelve Data time series fetch failed');
        const data = (await res.json());
        if (data.status === 'error')
            throw new Error(data.message);
        const values = data.values || [];
        return values.map((val) => ({
            time: val.datetime,
            open: parseFloat(val.open),
            high: parseFloat(val.high),
            low: parseFloat(val.low),
            close: parseFloat(val.close),
            volume: parseInt(val.volume),
        })).reverse();
    }
    async search(query) {
        const res = await fetch(`${this.baseUrl}/symbol_search?symbol=${query}&apikey=${this.apiKey}`);
        if (!res.ok)
            throw new Error('Twelve Data symbol search failed');
        const data = (await res.json());
        if (data.status === 'error')
            throw new Error(data.message);
        const dataList = data.data || [];
        return dataList.map((item) => ({
            symbol: item.symbol,
            name: item.instrument_name,
            exchange: item.exchange,
            type: item.instrument_type,
        }));
    }
}
exports.TwelveDataProvider = TwelveDataProvider;
