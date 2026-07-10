"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockService = exports.StockService = void 0;
const twelveData_provider_1 = require("./twelveData.provider");
const mockData_provider_1 = require("./mockData.provider");
class StockService {
    provider;
    cache = new Map();
    cacheDurationMs = 60 * 1000; // 1 minute cache
    constructor() {
        const key = process.env.TWELVE_DATA_API_KEY;
        if (key && key !== 'dummy_key' && key.trim() !== '') {
            this.provider = new twelveData_provider_1.TwelveDataProvider(key);
        }
        else {
            this.provider = new mockData_provider_1.MockDataProvider();
        }
    }
    async getQuote(symbol) {
        const cleanSym = symbol.toUpperCase();
        const cached = this.cache.get(cleanSym);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.quote;
        }
        try {
            const quote = await this.provider.getQuote(cleanSym);
            this.cache.set(cleanSym, {
                quote,
                expiresAt: Date.now() + this.cacheDurationMs,
            });
            return quote;
        }
        catch (err) {
            if (!(this.provider instanceof mockData_provider_1.MockDataProvider)) {
                const fallback = new mockData_provider_1.MockDataProvider();
                return await fallback.getQuote(cleanSym);
            }
            throw err;
        }
    }
    async getProfile(symbol) {
        const cleanSym = symbol.toUpperCase();
        try {
            return await this.provider.getProfile(cleanSym);
        }
        catch (err) {
            if (!(this.provider instanceof mockData_provider_1.MockDataProvider)) {
                const fallback = new mockData_provider_1.MockDataProvider();
                return await fallback.getProfile(cleanSym);
            }
            throw err;
        }
    }
    async getHistory(symbol, interval = '1day', outputsize = 30) {
        const cleanSym = symbol.toUpperCase();
        try {
            return await this.provider.getHistory(cleanSym, interval, outputsize);
        }
        catch (err) {
            if (!(this.provider instanceof mockData_provider_1.MockDataProvider)) {
                const fallback = new mockData_provider_1.MockDataProvider();
                return await fallback.getHistory(cleanSym, interval, outputsize);
            }
            throw err;
        }
    }
    async search(query) {
        try {
            return await this.provider.search(query);
        }
        catch (err) {
            if (!(this.provider instanceof mockData_provider_1.MockDataProvider)) {
                const fallback = new mockData_provider_1.MockDataProvider();
                return await fallback.search(query);
            }
            throw err;
        }
    }
}
exports.StockService = StockService;
exports.stockService = new StockService();
exports.default = exports.stockService;
