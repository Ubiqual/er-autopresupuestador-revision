/*
  Warnings:

  - Made the column `excursionsLimit` on table `rest_hours` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fullDayDriving` on table `rest_hours` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fullDayRest` on table `rest_hours` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "rest_hours" ALTER COLUMN "excursionsLimit" SET NOT NULL,
ALTER COLUMN "fullDayDriving" SET NOT NULL,
ALTER COLUMN "fullDayRest" SET NOT NULL;
