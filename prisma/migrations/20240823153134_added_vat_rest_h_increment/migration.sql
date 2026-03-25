-- AlterTable
ALTER TABLE "service" ALTER COLUMN "order" DROP DEFAULT;

-- CreateTable
CREATE TABLE "vat" (
    "id" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rest_hours" (
    "id" TEXT NOT NULL,
    "hoursPerDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rest_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_increment" (
    "id" TEXT NOT NULL,
    "adjustmentPercentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_increment_pkey" PRIMARY KEY ("id")
);
