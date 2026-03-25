/*
  Warnings:

  - You are about to drop the column `hoursPerDay` on the `rest_hours` table. All the data in the column will be lost.
  - Added the required column `drivingTime` to the `rest_hours` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restDuration` to the `rest_hours` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rest_hours" DROP COLUMN "hoursPerDay",
ADD COLUMN     "drivingTime" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "restDuration" DOUBLE PRECISION NOT NULL;
