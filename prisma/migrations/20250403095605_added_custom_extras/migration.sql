-- CreateTable
CREATE TABLE "custom_extras" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "custom_extras_pkey" PRIMARY KEY ("id")
);
