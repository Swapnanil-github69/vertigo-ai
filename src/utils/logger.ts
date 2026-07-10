import winston from 'winston';
import morgan from 'morgan';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

const logDir = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}] ${
      info.requestId ? `[ReqID: ${info.requestId}]` : ''
    } ${info.message}${info.stack ? `\n${info.stack}` : ''}`
  )
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}] ${
      info.requestId ? `[ReqID: ${info.requestId}]` : ''
    } ${info.message}`
  )
);

export const logger = winston.createLogger({
  levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// Custom interface to extract RequestId safely
interface CustomRequest extends Request {
  requestId?: string;
}

// Morgan token for Request ID
morgan.token('requestId', (req: CustomRequest) => req.requestId || '-');

export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms [ReqID: :requestId]',
  {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }
);

export default logger;
