"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpRepository = exports.OtpRepository = void 0;
const client_1 = require("../database/client");
class OtpRepository {
    async findLatestActive(email, type) {
        return client_1.prisma.otp.findFirst({
            where: {
                email,
                type,
                expiresAt: { gt: new Date() },
                verifiedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return client_1.prisma.otp.create({ data });
    }
    async update(id, data) {
        return client_1.prisma.otp.update({ where: { id }, data });
    }
    async markAsVerified(id) {
        return client_1.prisma.otp.update({
            where: { id },
            data: { verifiedAt: new Date() },
        });
    }
    async incrementAttempts(id) {
        return client_1.prisma.otp.update({
            where: { id },
            data: { attempts: { increment: 1 } },
        });
    }
    async delete(id) {
        return client_1.prisma.otp.delete({ where: { id } });
    }
}
exports.OtpRepository = OtpRepository;
exports.otpRepository = new OtpRepository();
exports.default = exports.otpRepository;
