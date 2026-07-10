"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const errorHandlerMiddleware = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    const requestId = req.requestId || '-';
    if (err instanceof errors_1.AppError) {
        // Log operational exceptions
        if (err.statusCode >= 500) {
            logger_1.logger.error(`AppError: ${err.message}`, { stack: err.stack, requestId });
        }
        else {
            logger_1.logger.warn(`AppError (${err.statusCode}): ${err.message}`, { requestId });
        }
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            data: null,
            errors: err.errors,
            timestamp: new Date().toISOString(),
            requestId,
        });
    }
    // Unhandled server exception (e.g. database drop connection)
    logger_1.logger.error(`Unhandled Exception: ${err.message}`, { stack: err.stack, requestId });
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected server error occurred. Contact system administration.'
        : err.message;
    return res.status(500).json({
        success: false,
        message,
        data: null,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId,
    });
};
exports.errorHandlerMiddleware = errorHandlerMiddleware;
exports.default = exports.errorHandlerMiddleware;
