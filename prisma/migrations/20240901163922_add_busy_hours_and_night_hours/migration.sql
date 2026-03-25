-- CreateTable
CREATE TABLE "busy_hours" (
    "id" TEXT NOT NULL,
    "startTimeMorning" TEXT NOT NULL,
    "endTimeMorning" TEXT NOT NULL,
    "startTimeAfternoon" TEXT NOT NULL,
    "endTimeAfternoon" TEXT NOT NULL,
    "adjustmentPercentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "busy_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "night_hours" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "adjustmentPercentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "night_hours_pkey" PRIMARY KEY ("id")
);
