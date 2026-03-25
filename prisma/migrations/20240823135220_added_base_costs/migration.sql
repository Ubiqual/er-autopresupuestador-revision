-- AlterTable
ALTER TABLE "service" ALTER COLUMN "order" DROP DEFAULT;

-- CreateTable
CREATE TABLE "base_cost" (
    "id" TEXT NOT NULL,
    "pricePerKm" DOUBLE PRECISION NOT NULL,
    "pricePerMinute" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "base_cost_pkey" PRIMARY KEY ("id")
);
