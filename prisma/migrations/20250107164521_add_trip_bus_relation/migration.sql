-- CreateTable
CREATE TABLE "TripBus" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "busTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "TripBus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_bus_unique" ON "TripBus"("tripId", "busTypeId");
