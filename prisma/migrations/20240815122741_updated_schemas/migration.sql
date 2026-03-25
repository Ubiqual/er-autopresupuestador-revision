/*
  Warnings:

  - The primary key for the `base_address` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `bus_category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `active` on the `bus_category` table. All the data in the column will be lost.
  - The primary key for the `bus_type` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `active` on the `bus_type` table. All the data in the column will be lost.
  - The primary key for the `service` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `active` on the `service` table. All the data in the column will be lost.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `base_address` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `bus_category` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `bus_type` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `service` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `user` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "base_address" DROP CONSTRAINT "base_address_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "base_address_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "bus_category" DROP CONSTRAINT "bus_category_pkey",
DROP COLUMN "active",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "bus_category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "bus_type" DROP CONSTRAINT "bus_type_pkey",
DROP COLUMN "active",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "bus_type_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "service" DROP CONSTRAINT "service_pkey",
DROP COLUMN "active",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "service_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");
