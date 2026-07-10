import { prisma } from '../database/client';
import { Prisma, Otp } from '@prisma/client';

export class OtpRepository {
  async findLatestActive(email: string, type: string): Promise<Otp | null> {
    return prisma.otp.findFirst({
      where: {
        email,
        type,
        expiresAt: { gt: new Date() },
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.OtpCreateInput): Promise<Otp> {
    return prisma.otp.create({ data });
  }

  async update(id: string, data: Prisma.OtpUpdateInput): Promise<Otp> {
    return prisma.otp.update({ where: { id }, data });
  }

  async markAsVerified(id: string): Promise<Otp> {
    return prisma.otp.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  async incrementAttempts(id: string): Promise<Otp> {
    return prisma.otp.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async delete(id: string): Promise<Otp> {
    return prisma.otp.delete({ where: { id } });
  }
}

export const otpRepository = new OtpRepository();
export default otpRepository;
