"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    phoneNumber: zod_1.z.string().nullable().or(zod_1.z.string().length(0)).optional(),
    dateOfBirth: zod_1.z.string().nullable().or(zod_1.z.string().length(0)).or(zod_1.z.date()).optional(),
    country: zod_1.z.string().nullable().or(zod_1.z.string().length(0)).optional(),
    timezone: zod_1.z.string().nullable().or(zod_1.z.string().length(0)).optional(),
    language: zod_1.z.string().nullable().or(zod_1.z.string().length(0)).optional(),
});
