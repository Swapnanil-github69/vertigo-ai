export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: any;

  constructor(message: string, statusCode: number, errors: any = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", errors: any = null) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized Access") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource Not Found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource Conflict") {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error") {
    super(message, 500, null, false);
  }
}

export class ValidationError extends AppError {
  constructor(errors: any) {
    super("Validation Failed", 422, errors);
  }
}
