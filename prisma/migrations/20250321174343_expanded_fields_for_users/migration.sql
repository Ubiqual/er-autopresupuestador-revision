-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('PERSONAL', 'COMPANY');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contacto" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "phone" INTEGER,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'PERSONAL';
