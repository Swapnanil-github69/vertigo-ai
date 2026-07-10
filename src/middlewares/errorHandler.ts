import { Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { CustomRequest } from './requestId';

export const errorHandlerMiddleware = (
  err: Error,
  req: CustomRequest,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.requestId || '-';

  if (err instanceof AppError) {
    // Log operational exceptions
    if (err.statusCode >= 500) {
      logger.error(`AppError: ${err.message}`, { stack: err.stack, requestId });
    } else {
      logger.warn(`AppError (${err.statusCode}): ${err.message}`, { requestId });
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
  logger.error(`Unhandled Exception: ${err.message}`, { stack: err.stack, requestId });

  const message =
    process.env.NODE_ENV === 'production'
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

export default errorHandlerMiddleware;
