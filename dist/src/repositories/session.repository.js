"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = exports.SessionRepository = void 0;
const client_1 = require("../database/client");
class SessionRepository {
    async findById(id) {
        return client_1.prisma.session.findUnique({ where: { id } });
    }
    async findByToken(token) {
        return client_1.prisma.session.findUnique({ where: { token } });
    }
    async findActiveByUserId(userId) {
        return client_1.prisma.session.findMany({
            where: { userId, active: true },
            orderBy: { lastActivity: 'desc' },
        });
    }
    async create(data) {
        return client_1.prisma.session.create({ data });
    }
    async update(id, data) {
        return client_1.prisma.session.update({ where: { id }, data });
    }
    async deactivate(id) {
        return client_1.prisma.session.update({
            where: { id },
            data: { active: false },
        });
    }
    async deactivateAllOther(userId, keepSessionId) {
        return client_1.prisma.session.updateMany({
            where: {
                userId,
                id: { not: keepSessionId },
                active: true,
            },
            data: { active: false },
        });
    }
    async deactivateAll(userId) {
        return client_1.prisma.session.updateMany({
            where: { userId, active: true },
            data: { active: false },
        });
    }
}
exports.SessionRepository = SessionRepository;
exports.sessionRepository = new SessionRepository();
exports.default = exports.sessionRepository;
