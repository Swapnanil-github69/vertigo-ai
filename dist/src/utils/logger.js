"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganMiddleware = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logDir = path_1.default.join(process.cwd(), 'logs');
// Ensure log directory exists
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf((info) => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.requestId ? `[ReqID: ${info.requestId}]` : ''} ${info.message}${info.stack ? `\n${info.stack}` : ''}`));
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.printf((info) => `[${info.timestamp}] [${info.level}] ${info.requestId ? `[ReqID: ${info.requestId}]` : ''} ${info.message}`));
exports.logger = winston_1.default.createLogger({
    levels,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format,
    transports: [
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'combined.log'),
        }),
    ],
});
// Morgan token for Request ID
morgan_1.default.token('requestId', (req) => req.requestId || '-');
exports.morganMiddleware = (0, morgan_1.default)(':method :url :status :res[content-length] - :response-time ms [ReqID: :requestId]', {
    stream: {
        write: (message) => exports.logger.http(message.trim()),
    },
});
exports.default = exports.logger;
