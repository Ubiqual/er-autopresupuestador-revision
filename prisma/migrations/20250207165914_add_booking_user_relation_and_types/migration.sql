/*
  Warnings:

  - Added the required column `bookingType` to the `Bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Bookings` table without a default value. This is not possible if the table is not empty.
*/

-- Create Enum
CREATE TYPE "BookingsType" AS ENUM ('saved', 'requested', 'accepted', 'declined');

-- Alter Table: Add new columns
ALTER TABLE "Bookings"
  ADD COLUMN "bookingType" "BookingsType",
  ADD COLUMN "userId" TEXT;

-- Finally, add the NOT NULL constraints if required.
ALTER TABLE "Bookings"
  ALTER COLUMN "bookingType" SET NOT NULL,
  ALTER COLUMN "userId" SET NOT NULL;