import { Response, NextFunction } from 'express';
import { CustomRequest } from './requestId';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export const authMiddleware = (req: CustomRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token required.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired authentication token.');
  }
};

export const adminMiddleware = (req: CustomRequest, _res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) {
    throw new UnauthorizedError('Authentication token required.');
  }

  if (user.role !== 'ADMIN') {
    throw new ForbiddenError('Administrator clearance required.');
  }

  next();
};
