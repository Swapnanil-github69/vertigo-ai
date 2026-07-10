"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables from .env file
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(8000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string().url({ message: "DATABASE_URL must be a valid connection string URL" }),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16, { message: "JWT_ACCESS_SECRET must be at least 16 characters long" }),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16, { message: "JWT_REFRESH_SECRET must be at least 16 characters long" }),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:8000'),
    GEMINI_API_KEY: zod_1.z.string().min(5, { message: "GEMINI_API_KEY is required and must be valid" }),
    SMTP_HOST: zod_1.z.string().default('smtp.mailtrap.io'),
    SMTP_PORT: zod_1.z.coerce.number().default(2525),
    SMTP_USER: zod_1.z.string().default('smtp_user'),
    SMTP_PASS: zod_1.z.string().default('smtp_pass'),
    SMTP_FROM: zod_1.z.string().email().default('no-reply@vertigo.ai'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Environment configuration validation failed:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}
exports.config = parsed.data;
exports.default = exports.config;
