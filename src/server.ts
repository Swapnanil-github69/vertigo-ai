import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './prisma/client';

const server = app.listen(config.PORT, async () => {
  logger.info(`🚀 Vertigo Core Engine initialized in [${config.NODE_ENV}] mode`);
  logger.info(`📡 Port active at: http://localhost:${config.PORT}`);

  try {
    // Quick ping to check MongoDB connection
    await prisma.$runCommandRaw({ ping: 1 });
    logger.info('🔑 Database surveillance channel established successfully.');
  } catch (error) {
    logger.error('❌ Failed to establish database connection on startup:', error);
  }
});

const handleFatalError = (error: Error, type: string) => {
  logger.error(`FATAL EXCEPTION [${type}]: ${error.message}`, { stack: error.stack });

  // Gracefully close active database connections
  prisma.$disconnect().catch((err) => {
    logger.error('Failed to close Prisma connections on termination:', err);
  });

  server.close(() => {
    logger.info('🛑 Vertigo server closed gracefully.');
    process.exit(1);
  });
};

process.on('uncaughtException', (error) => handleFatalError(error, 'uncaughtException'));
process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  handleFatalError(error, 'unhandledRejection');
});

process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM signal received. Commencing graceful termination.');
  server.close(() => {
    prisma.$disconnect().then(() => {
      logger.info('🛑 Vertigo server closed gracefully.');
      process.exit(0);
    });
  });
});
