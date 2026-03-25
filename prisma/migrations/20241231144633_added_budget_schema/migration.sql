-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "baseAddress" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalDuration" DOUBLE PRECISION,
    "totalDistance" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "days" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "pickupId" TEXT NOT NULL,
    "dropoffId" TEXT NOT NULL,

    CONSTRAINT "DailyStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopData" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "time" TEXT,
    "day" INTEGER NOT NULL,

    CONSTRAINT "StopData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingResult" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION,
    "totalDuration" DOUBLE PRECISION,
    "restTimePrice" DOUBLE PRECISION,
    "minimumPerDayDuration" DOUBLE PRECISION,
    "minimumPricePerDayDuration" DOUBLE PRECISION,
    "minimumTimePerDayDuration" DOUBLE PRECISION,

    CONSTRAINT "PricingResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentPricing" (
    "id" TEXT NOT NULL,
    "pricingResultId" TEXT NOT NULL,
    "segment" INTEGER NOT NULL,
    "distance" DOUBLE PRECISION,
    "duration" DOUBLE PRECISION,
    "adjustedDistance" DOUBLE PRECISION,
    "adjustedDuration" DOUBLE PRECISION,
    "kmPrice" DOUBLE PRECISION,
    "timePrice" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "priceWithoutMinimums" DOUBLE PRECISION,
    "kmPriceWithMinimum" DOUBLE PRECISION,
    "timePriceWithMinimum" DOUBLE PRECISION,
    "kmPriceWithoutMinimum" DOUBLE PRECISION,
    "timePriceWithoutMinimum" DOUBLE PRECISION,
    "totalPriceWithMinimumWithoutRest" DOUBLE PRECISION,
    "restPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "segmentStartTime" TEXT,

    CONSTRAINT "SegmentPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingDetails" (
    "id" TEXT NOT NULL,
    "pricingResultId" TEXT NOT NULL,
    "numberOfPeople" INTEGER NOT NULL,
    "finalPricePerKm" DOUBLE PRECISION,
    "finalPricePerMinute" DOUBLE PRECISION,
    "seasonAdjustment" DOUBLE PRECISION,
    "busTypeAdjustment" DOUBLE PRECISION,
    "busyTimeAdjustment" DOUBLE PRECISION,
    "nightTimeAdjustment" DOUBLE PRECISION,

    CONSTRAINT "PricingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiddleSegmentPricing" (
    "id" TEXT NOT NULL,
    "pricingResultId" TEXT NOT NULL,
    "origin" TEXT,
    "arrivalTime" TEXT,
    "destination" TEXT,
    "distance" DOUBLE PRECISION,
    "kmPrice" DOUBLE PRECISION,
    "timePrice" DOUBLE PRECISION,
    "priceWithoutRest" DOUBLE PRECISION,
    "duration" DOUBLE PRECISION,
    "restPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "waitingTime" DOUBLE PRECISION,
    "totalDuration" DOUBLE PRECISION,
    "pickupTime" TEXT,

    CONSTRAINT "MiddleSegmentPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_extra" (
    "id" TEXT NOT NULL,
    "pricingResultId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_extra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissingKmInfo" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "effectiveDistance" DOUBLE PRECISION,
    "adjustedDistance" DOUBLE PRECISION,
    "missingKm" DOUBLE PRECISION,
    "additionalPrice" DOUBLE PRECISION,
    "differenceInTotalPrice" DOUBLE PRECISION,

    CONSTRAINT "MissingKmInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IntermediateRelation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "DailyStop_tripId_idx" ON "DailyStop"("tripId");

-- CreateIndex
CREATE INDEX "PricingResult_tripId_idx" ON "PricingResult"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "MissingKmInfo_tripId_key" ON "MissingKmInfo"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "_IntermediateRelation_AB_unique" ON "_IntermediateRelation"("A", "B");

-- CreateIndex
CREATE INDEX "_IntermediateRelation_B_index" ON "_IntermediateRelation"("B");
