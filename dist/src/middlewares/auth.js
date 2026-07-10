"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const authMiddleware = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errors_1.UnauthorizedError('Authentication token required.');
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        throw new errors_1.UnauthorizedError('Invalid or expired authentication token.');
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, _res, next) => {
    const user = req.user;
    if (!user) {
        throw new errors_1.UnauthorizedError('Authentication token required.');
    }
    if (user.role !== 'ADMIN') {
        throw new errors_1.ForbiddenError('Administrator clearance required.');
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
