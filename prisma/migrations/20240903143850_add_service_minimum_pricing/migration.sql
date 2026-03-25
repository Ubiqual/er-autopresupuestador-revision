-- CreateTable
CREATE TABLE "service_minimum_pricing" (
    "id" TEXT NOT NULL,
    "minimumKM" DOUBLE PRECISION NOT NULL,
    "minimumTime" INTEGER NOT NULL,
    "serviceName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_minimum_pricing_pkey" PRIMARY KEY ("id")
);
