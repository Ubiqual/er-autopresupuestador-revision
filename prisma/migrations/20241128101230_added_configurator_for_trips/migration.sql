-- CreateTable
CREATE TABLE "configure_trips" (
    "id" TEXT NOT NULL,
    "minimumKmPerDay" DOUBLE PRECISION NOT NULL,
    "minimumTimePerDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configure_trips_pkey" PRIMARY KEY ("id")
);
