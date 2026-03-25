/*
  Warnings:

  - You are about to drop the `_PricingResultExtras` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "_PricingResultExtras";

-- CreateTable
CREATE TABLE "pricing_result_extra" (
    "id" TEXT NOT NULL,
    "pricingResultId" TEXT NOT NULL,
    "extraId" TEXT NOT NULL,

    CONSTRAINT "pricing_result_extra_pkey" PRIMARY KEY ("id")
);
