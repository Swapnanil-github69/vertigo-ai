"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
const requestId_1 = require("./middlewares/requestId");
const responseFormatter_1 = require("./middlewares/responseFormatter");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFound_1 = require("./middlewares/notFound");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const stock_routes_1 = __importDefault(require("./routes/stock.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const app = (0, express_1.default)();
// Standard Security and Compression Layers
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.CORS_ORIGIN,
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Custom Request tracing & logging
app.use(requestId_1.requestIdMiddleware);
app.use(logger_1.morganMiddleware);
app.use(responseFormatter_1.responseFormatterMiddleware);
// Rate Limiting (Prevent Brute Force)
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP to 150 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please retry in 15 minutes.',
        data: null,
        timestamp: new Date().toISOString(),
    },
});
app.use('/api', apiLimiter);
// Base Health Check endpoint
app.get('/api/health', (_req, res) => {
    res.ok({ status: 'UP', database: 'READY' }, 'Vertigo service core is online and stable.');
});
// Authentication Routes
app.use('/api/auth', auth_routes_1.default);
// User Routes
app.use('/api/users', user_routes_1.default);
// Stock Routes
app.use('/api/stocks', stock_routes_1.default);
// AI Routes
app.use('/api/ai', ai_routes_1.default);
// Catch unmapped routes
app.use(notFound_1.notFoundMiddleware);
// Centralized error parsing
app.use(errorHandler_1.errorHandlerMiddleware);
exports.default = app;
