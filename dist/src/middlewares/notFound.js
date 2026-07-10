"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = void 0;
const errors_1 = require("../utils/errors");
const notFoundMiddleware = (req, res, next) => {
    next(new errors_1.NotFoundError(`Requested API route [${req.method}] ${req.originalUrl} was not found`));
};
exports.notFoundMiddleware = notFoundMiddleware;
exports.default = exports.notFoundMiddleware;
