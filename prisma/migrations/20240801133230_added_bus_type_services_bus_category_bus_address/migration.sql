-- CreateTable
CREATE TABLE "base_address" (
    "address" TEXT NOT NULL,

    CONSTRAINT "base_address_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "bus_type" (
    "numberOfPeople" INTEGER NOT NULL,
    "adjustmentPercentage" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL,
    "isDefault" BOOLEAN NOT NULL,

    CONSTRAINT "bus_type_pkey" PRIMARY KEY ("numberOfPeople")
);

-- CreateTable
CREATE TABLE "service" (
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "bus_category" (
    "name" TEXT NOT NULL,
    "adjustmentPercentage" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "bus_category_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "base_address_address_key" ON "base_address"("address");

-- CreateIndex
CREATE UNIQUE INDEX "bus_type_numberOfPeople_key" ON "bus_type"("numberOfPeople");

-- CreateIndex
CREATE UNIQUE INDEX "service_name_key" ON "service"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bus_category_name_key" ON "bus_category"("name");

-- Create Trigger Function with this function we restrict the bus_type table to only one row with isDefault = true
CREATE OR REPLACE FUNCTION enforce_single_default()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if we are setting isDefault = true
    IF (NEW."isDefault" = true) THEN
        -- Check if another row already has isDefault = true
        IF EXISTS (SELECT 1 FROM public.bus_type WHERE "isDefault" = true) THEN
            RAISE EXCEPTION 'Only one row can have isDefault = true';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
CREATE TRIGGER enforce_single_default_trigger
BEFORE INSERT OR UPDATE ON public.bus_type
FOR EACH ROW EXECUTE FUNCTION enforce_single_default();