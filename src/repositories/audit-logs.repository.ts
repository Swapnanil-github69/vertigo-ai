import { prisma } from '../database/client';
import { Prisma, AuditLogs } from '@prisma/client';

export class AuditLogsRepository {
  async create(data: Prisma.AuditLogsCreateInput): Promise<AuditLogs> {
    return prisma.auditLogs.create({ data });
  }

  async findByUserId(userId: string): Promise<AuditLogs[]> {
    return prisma.auditLogs.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export const auditLogsRepository = new AuditLogsRepository();
export default auditLogsRepository;
