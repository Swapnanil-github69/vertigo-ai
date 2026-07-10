import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/errors';

export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Requested API route [${req.method}] ${req.originalUrl} was not found`));
};

export default notFoundMiddleware;
