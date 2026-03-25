-- AlterTable
ALTER TABLE "service" ALTER COLUMN "order" DROP DEFAULT;

-- CreateTable
CREATE TABLE "season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adjustmentPercentage" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_day" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_day_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "season_name_key" ON "season"("name");

-- CreateIndex
CREATE UNIQUE INDEX "season_day_day_key" ON "season_day"("day");

-- CreateIndex
CREATE UNIQUE INDEX "season_day_day_seasonId_key" ON "season_day"("day", "seasonId");
