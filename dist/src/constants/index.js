"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_MESSAGES = exports.USER_STATUS = exports.ROLES = exports.HTTP_STATUS = void 0;
/**
 * HTTP Status Codes
 */
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
};
/**
 * User Roles
 */
exports.ROLES = {
    USER: 'USER',
    ADMIN: 'ADMIN',
};
/**
 * User Statuses
 */
exports.USER_STATUS = {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    BLOCKED: 'BLOCKED',
};
/**
 * System Messages
 */
exports.SYSTEM_MESSAGES = {
    SUCCESS: 'Operation completed successfully.',
    ERROR: 'An unexpected error occurred.',
    NOT_FOUND: 'Resource not found.',
    UNAUTHORIZED: 'Authentication required.',
    FORBIDDEN: 'Access denied.',
};
