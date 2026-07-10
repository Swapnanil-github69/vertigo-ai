"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const client_1 = require("./prisma/client");
const server = app_1.default.listen(config_1.config.PORT, async () => {
    logger_1.logger.info(`🚀 Vertigo Core Engine initialized in [${config_1.config.NODE_ENV}] mode`);
    logger_1.logger.info(`📡 Port active at: http://localhost:${config_1.config.PORT}`);
    try {
        // Quick ping to check PostgreSQL connection
        await client_1.prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('🔑 Database surveillance channel established successfully.');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to establish database connection on startup:', error);
    }
});
const handleFatalError = (error, type) => {
    logger_1.logger.error(`FATAL EXCEPTION [${type}]: ${error.message}`, { stack: error.stack });
    // Gracefully close active database connections
    client_1.prisma.$disconnect().catch((err) => {
        logger_1.logger.error('Failed to close Prisma connections on termination:', err);
    });
    server.close(() => {
        logger_1.logger.info('🛑 Vertigo server closed gracefully.');
        process.exit(1);
    });
};
process.on('uncaughtException', (error) => handleFatalError(error, 'uncaughtException'));
process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    handleFatalError(error, 'unhandledRejection');
});
process.on('SIGTERM', () => {
    logger_1.logger.info('👋 SIGTERM signal received. Commencing graceful termination.');
    server.close(() => {
        client_1.prisma.$disconnect().then(() => {
            logger_1.logger.info('🛑 Vertigo server closed gracefully.');
            process.exit(0);
        });
    });
});
