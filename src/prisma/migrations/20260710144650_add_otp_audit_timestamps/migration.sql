-- AlterTable
ALTER TABLE "LoginHistory" ADD COLUMN     "otpGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "otpVerifiedAt" TIMESTAMP(3);
