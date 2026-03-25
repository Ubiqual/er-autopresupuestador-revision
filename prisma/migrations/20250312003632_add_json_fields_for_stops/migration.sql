/*
  Warnings:

  - You are about to drop the column `dropoffId` on the `DailyStop` table. All the data in the column will be lost.
  - You are about to drop the column `pickupId` on the `DailyStop` table. All the data in the column will be lost.
  - You are about to drop the `StopData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_IntermediateRelation` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "DailyStop" DROP COLUMN "dropoffId",
DROP COLUMN "pickupId",
ADD COLUMN     "dropoff" JSONB,
ADD COLUMN     "intermediates" JSONB,
ADD COLUMN     "pickup" JSONB;

-- DropTable
DROP TABLE "StopData";

-- DropTable
DROP TABLE "_IntermediateRelation";
