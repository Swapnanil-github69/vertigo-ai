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
  RESEND_API_KEY: z.string().min(1, { message: "RESEND_API_KEY must not be empty" }),
  EMAIL_FROM: z.string().email({ message: "EMAIL_FROM must be a valid email address" }),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Environment configuration validation failed:');
  const errors = parsed.error.format();
  Object.keys(errors).forEach((key) => {
    if (key !== '_errors') {
      const fieldErrors = (errors as any)[key]?._errors;
      if (fieldErrors && fieldErrors.length > 0) {
        console.error('\x1b[31m%s\x1b[0m', `   - ${key}: ${fieldErrors.join(', ')}`);
      }
    }
  });
  process.exit(1);
}

export const config = parsed.data;

// Validate that RESEND_API_KEY is not a placeholder
if (!config.RESEND_API_KEY || config.RESEND_API_KEY === 're_placeholder_key' || config.RESEND_API_KEY.trim() === '') {
  console.error('\x1b[31m%s\x1b[0m', '❌ Environment configuration validation failed:');
  console.error('\x1b[31m%s\x1b[0m', '   - RESEND_API_KEY: Cannot be empty or use the placeholder value ("re_placeholder_key").');
  process.exit(1);
}

// Print Google Auth configuration diagnostics
if (!config.GOOGLE_CLIENT_ID || config.GOOGLE_CLIENT_ID === 'placeholder_google_client_id' ||
    !config.GOOGLE_CLIENT_SECRET || config.GOOGLE_CLIENT_SECRET === 'placeholder_google_client_secret') {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  [WARNING] Google Authentication configuration is incomplete or using placeholders. Google Sign-In will be disabled.');
} else {
  console.log('\x1b[32m%s\x1b[0m', '✅ [INFO] Google Authentication config successfully validated.');
}

export type Config = typeof config;
export default config;

