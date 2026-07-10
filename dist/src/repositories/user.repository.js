"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const client_1 = require("../database/client");
class UserRepository {
    async findById(id) {
        return client_1.prisma.user.findUnique({ where: { id } });
    }
    async findByEmail(email) {
        return client_1.prisma.user.findUnique({ where: { email } });
    }
    async findByGoogleId(googleId) {
        return client_1.prisma.user.findUnique({ where: { googleId } });
    }
    async create(data) {
        return client_1.prisma.user.create({ data });
    }
    async update(id, data) {
        return client_1.prisma.user.update({ where: { id }, data });
    }
    async delete(id) {
        return client_1.prisma.user.delete({ where: { id } });
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
exports.default = exports.userRepository;
