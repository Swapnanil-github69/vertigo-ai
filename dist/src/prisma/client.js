"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const prismaGlobal = global;
exports.prisma = prismaGlobal.prisma ||
    new client_1.PrismaClient({
        log: config_1.config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (config_1.config.NODE_ENV !== 'production') {
    prismaGlobal.prisma = exports.prisma;
}
exports.default = exports.prisma;
