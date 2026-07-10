import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid connection string URL" }),
  JWT_ACCESS_SECRET: z.string().min(16, { message: "JWT_ACCESS_SECRET must be at least 16 characters long" }),
  JWT_REFRESH_SECRET: z.string().min(16, { message: "JWT_REFRESH_SECRET must be at least 16 characters long" }),
  CORS_ORIGIN: z.string().default('http://localhost:8000'),
  GEMINI_API_KEY: z.string().min(5, { message: "GEMINI_API_KEY is required and must be valid" }),
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_USER: z.string().default('smtp_user'),
  SMTP_PASS: z.string().default('smtp_pass'),
  SMTP_FROM: z.string().email().default('no-reply@vertigo.ai'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment configuration validation failed:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
export default config;
