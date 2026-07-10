/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
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
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

/**
 * User Roles
 */
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * User Statuses
 */
export const USER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
} as const;

export type UserStatusType = typeof USER_STATUS[keyof typeof USER_STATUS];

/**
 * System Messages
 */
export const SYSTEM_MESSAGES = {
  SUCCESS: 'Operation completed successfully.',
  ERROR: 'An unexpected error occurred.',
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'Authentication required.',
  FORBIDDEN: 'Access denied.',
} as const;
