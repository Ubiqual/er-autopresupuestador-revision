-- CreateTable
CREATE TABLE "configure_weddings" (
    "id" TEXT NOT NULL,
    "minimumReturnTime" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configure_weddings_pkey" PRIMARY KEY ("id")
);
