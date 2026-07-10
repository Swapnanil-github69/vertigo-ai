import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { requestIdMiddleware } from './middlewares/requestId';
import { responseFormatterMiddleware } from './middlewares/responseFormatter';
import { morganMiddleware } from './utils/logger';
import { errorHandlerMiddleware } from './middlewares/errorHandler';
import { notFoundMiddleware } from './middlewares/notFound';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import stockRouter from './routes/stock.routes';
import aiRouter from './routes/ai.routes';

import path from 'path';

const app = express();

// Standard Security and Compression Layers
// Configure Helmet with Content Security Policy to allow frontend CDN dependencies
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.tailwindcss.com",
          "https://unpkg.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://images.unsplash.com",
          "https://lh3.googleusercontent.com",
          "*",
        ],
        connectSrc: [
          "'self'",
          "http://localhost:3000",
          "http://localhost:8000",
          "*",
        ],
      },
    },
  })
);

const corsOrigins = config.CORS_ORIGIN.split(',');
app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from workspace root
app.use(express.static(path.resolve(__dirname, '../')));

// Custom Request tracing & logging
app.use(requestIdMiddleware);
app.use(morganMiddleware);
app.use(responseFormatterMiddleware);

// Rate Limiting (Prevent Brute Force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please retry in 15 minutes.',
    data: null,
    timestamp: new Date().toISOString(),
  },
});
app.use('/api', apiLimiter);

// Base Health Check endpoint
app.get('/api/health', (_req, res) => {
  res.ok({ status: 'UP', database: 'READY' }, 'Vertigo service core is online and stable.');
});

// Authentication Routes
app.use('/api/auth', authRouter);

// User Routes
app.use('/api/users', userRouter);

// Stock Routes
app.use('/api/stocks', stockRouter);

// AI Routes
app.use('/api/ai', aiRouter);

// Catch unmapped routes
app.use(notFoundMiddleware);

// Centralized error parsing
app.use(errorHandlerMiddleware);

export default app;
