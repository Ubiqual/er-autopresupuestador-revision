/*
  Warnings:

  - The `createdAt` column on the `Trip` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `updatedAt` on the `Trip` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "updatedAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
