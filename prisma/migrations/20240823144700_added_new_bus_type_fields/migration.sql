/*
  Warnings:

  - Added the required column `rangeMaxSeats` to the `bus_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rangeMinSeats` to the `bus_type` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bus_type" ADD COLUMN     "rangeMaxSeats" INTEGER NOT NULL,
ADD COLUMN     "rangeMinSeats" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "service" ALTER COLUMN "order" DROP DEFAULT;
