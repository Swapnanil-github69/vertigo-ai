import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prismaGlobal = global as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({
    log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma;
}

export default prisma;
