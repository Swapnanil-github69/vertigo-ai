import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phoneNumber: z.string().nullable().or(z.string().length(0)).optional(),
  dateOfBirth: z.string().nullable().or(z.string().length(0)).or(z.date()).optional(),
  country: z.string().nullable().or(z.string().length(0)).optional(),
  timezone: z.string().nullable().or(z.string().length(0)).optional(),
  language: z.string().nullable().or(z.string().length(0)).optional(),
});
