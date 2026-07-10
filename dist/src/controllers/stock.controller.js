"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockController = exports.StockController = void 0;
const stock_service_1 = require("../services/stock/stock.service");
const zod_1 = require("zod");
class StockController {
    async getQuote(req, res) {
        const { symbol } = zod_1.z.object({ symbol: zod_1.z.string().min(1) }).parse(req.query);
        const quote = await stock_service_1.stockService.getQuote(symbol);
        return res.status(200).json({
            success: true,
            message: 'Quote retrieved.',
            data: quote,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async getProfile(req, res) {
        const { symbol } = zod_1.z.object({ symbol: zod_1.z.string().min(1) }).parse(req.query);
        const profile = await stock_service_1.stockService.getProfile(symbol);
        return res.status(200).json({
            success: true,
            message: 'Company profile retrieved.',
            data: profile,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async getHistory(req, res) {
        const { symbol, interval, outputsize } = zod_1.z.object({
            symbol: zod_1.z.string().min(1),
            interval: zod_1.z.string().optional(),
            outputsize: zod_1.z.preprocess((val) => (val ? parseInt(val) : undefined), zod_1.z.number().optional()),
        }).parse(req.query);
        const history = await stock_service_1.stockService.getHistory(symbol, interval || '1day', outputsize || 30);
        return res.status(200).json({
            success: true,
            message: 'Historical price vector retrieved.',
            data: history,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
    async search(req, res) {
        const { query } = zod_1.z.object({ query: zod_1.z.string().min(1) }).parse(req.query);
        const results = await stock_service_1.stockService.search(query);
        return res.status(200).json({
            success: true,
            message: 'Symbols parsed.',
            data: results,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    }
}
exports.StockController = StockController;
exports.stockController = new StockController();
exports.default = exports.stockController;
