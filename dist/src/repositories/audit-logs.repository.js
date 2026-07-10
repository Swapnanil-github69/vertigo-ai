"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsRepository = exports.AuditLogsRepository = void 0;
const client_1 = require("../database/client");
class AuditLogsRepository {
    async create(data) {
        return client_1.prisma.auditLogs.create({ data });
    }
    async findByUserId(userId) {
        return client_1.prisma.auditLogs.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
        });
    }
}
exports.AuditLogsRepository = AuditLogsRepository;
exports.auditLogsRepository = new AuditLogsRepository();
exports.default = exports.auditLogsRepository;
