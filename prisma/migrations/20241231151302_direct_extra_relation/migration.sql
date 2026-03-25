/*
  Warnings:

  - You are about to drop the `pricing_extra` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "pricing_extra";

-- CreateTable
CREATE TABLE "_PricingResultExtras" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PricingResultExtras_AB_unique" ON "_PricingResultExtras"("A", "B");

-- CreateIndex
CREATE INDEX "_PricingResultExtras_B_index" ON "_PricingResultExtras"("B");
