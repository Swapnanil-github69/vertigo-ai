"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseFormatterMiddleware = void 0;
const responseFormatterMiddleware = (req, res, next) => {
    res.ok = (data, message = 'Success', pagination) => {
        res.status(res.statusCode === 200 || res.statusCode === 201 ? res.statusCode : 200).json({
            success: true,
            message,
            data: data ?? null,
            pagination,
            timestamp: new Date().toISOString(),
            requestId: req.requestId || '-',
        });
    };
    next();
};
exports.responseFormatterMiddleware = responseFormatterMiddleware;
exports.default = exports.responseFormatterMiddleware;
