/*
  Warnings:

  - Added the required column `test` to the `test_delete` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "test_delete" ADD COLUMN     "test" TEXT NOT NULL;
