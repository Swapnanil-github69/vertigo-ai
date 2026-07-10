import { Response, NextFunction } from 'express';
import { CustomRequest } from './requestId';

declare global {
  namespace Express {
    interface Response {
      ok(data: any, message?: string, pagination?: any): void;
    }
  }
}

export const responseFormatterMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  res.ok = (data: any, message = 'Success', pagination?: any) => {
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

export default responseFormatterMiddleware;
