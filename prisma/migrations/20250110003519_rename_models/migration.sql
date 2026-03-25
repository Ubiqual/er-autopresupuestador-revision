/*
  Warnings:

  - You are about to drop the `Trip` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TripBus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Trip";

-- DropTable
DROP TABLE "TripBus";

-- CreateTable
CREATE TABLE "Bookings" (
    "id" TEXT NOT NULL,
    "baseAddress" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalDuration" DOUBLE PRECISION,
    "totalDistance" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "days" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingsSelectedBuses" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "busTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "BookingsSelectedBuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_bus_unique" ON "BookingsSelectedBuses"("tripId", "busTypeId");
