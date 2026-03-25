-- CreateTable
CREATE TABLE "ReturnTrip" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "stops" JSONB,
    "time" TEXT NOT NULL,
    "buses" JSONB,

    CONSTRAINT "ReturnTrip_pkey" PRIMARY KEY ("id")
);
