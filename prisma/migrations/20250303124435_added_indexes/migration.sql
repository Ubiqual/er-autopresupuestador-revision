-- AlterTable
ALTER TABLE "Bookings" ALTER COLUMN "bookingType" SET DEFAULT 'requested',
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Bookings_serviceType_idx" ON "Bookings"("serviceType");

-- CreateIndex
CREATE INDEX "Bookings_createdAt_idx" ON "Bookings"("createdAt");

-- CreateIndex
CREATE INDEX "Bookings_date_idx" ON "Bookings"("date");

-- CreateIndex
CREATE INDEX "Bookings_bookingType_idx" ON "Bookings"("bookingType");

-- CreateIndex
CREATE INDEX "Bookings_userId_idx" ON "Bookings"("userId");

-- CreateIndex
CREATE INDEX "Bookings_serviceType_createdAt_idx" ON "Bookings"("serviceType", "createdAt");

-- CreateIndex
CREATE INDEX "Bookings_serviceType_date_idx" ON "Bookings"("serviceType", "date");

-- CreateIndex
CREATE INDEX "Bookings_bookingType_createdAt_idx" ON "Bookings"("bookingType", "createdAt");

-- CreateIndex
CREATE INDEX "Bookings_userId_createdAt_idx" ON "Bookings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Bookings_userId_bookingType_idx" ON "Bookings"("userId", "bookingType");

-- CreateIndex
CREATE INDEX "Bookings_serviceType_bookingType_createdAt_idx" ON "Bookings"("serviceType", "bookingType", "createdAt");

-- CreateIndex
CREATE INDEX "Bookings_userId_serviceType_createdAt_idx" ON "Bookings"("userId", "serviceType", "createdAt");

-- CreateIndex
CREATE INDEX "Bookings_userId_bookingType_createdAt_idx" ON "Bookings"("userId", "bookingType", "createdAt");

-- CreateIndex
CREATE INDEX "Bookings_userId_serviceType_bookingType_createdAt_idx" ON "Bookings"("userId", "serviceType", "bookingType", "createdAt");
