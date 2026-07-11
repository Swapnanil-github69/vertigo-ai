-- AlterTable
ALTER TABLE "User" ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "googleAvatarUrl" TEXT,
ADD COLUMN     "language" TEXT DEFAULT 'en',
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "locale" TEXT,
ADD COLUMN     "loginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "profileCompletion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timezone" TEXT;
