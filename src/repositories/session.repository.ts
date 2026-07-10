import { prisma } from '../database/client';
import { Prisma, Session } from '@prisma/client';

export class SessionRepository {
  async findById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { id } });
  }

  async findByToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { token } });
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { userId, active: true },
      orderBy: { lastActivity: 'desc' },
    });
  }

  async create(data: Prisma.SessionCreateInput): Promise<Session> {
    return prisma.session.create({ data });
  }

  async update(id: string, data: Prisma.SessionUpdateInput): Promise<Session> {
    return prisma.session.update({ where: { id }, data });
  }

  async deactivate(id: string): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data: { active: false },
    });
  }

  async deactivateAllOther(userId: string, keepSessionId: string): Promise<Prisma.BatchPayload> {
    return prisma.session.updateMany({
      where: {
        userId,
        id: { not: keepSessionId },
        active: true,
      },
      data: { active: false },
    });
  }

  async deactivateAll(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.session.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
