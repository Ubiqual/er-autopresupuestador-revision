-- Insert into configure_trips table
INSERT INTO "configure_trips" ("id", "minimumKmPerDay", "minimumTimePerDay", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 200, 10, NOW(), NOW());

-- Insert into configure_weddings table
INSERT INTO "configure_weddings" ("id", "minimumReturnTime", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 2, NOW(), NOW());