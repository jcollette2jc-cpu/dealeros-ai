PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockNumber" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "dateIn" DATETIME,
    "retailPrice" DECIMAL NOT NULL DEFAULT 0,
    "vehicleCost" DECIMAL NOT NULL DEFAULT 0,
    "reconCost" DECIMAL NOT NULL DEFAULT 0,
    "otherCost" DECIMAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "notes" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Vehicle" (
    "id", "stockNumber", "vin", "year", "make", "model", "mileage",
    "dateIn", "retailPrice", "vehicleCost", "reconCost", "otherCost",
    "color", "status", "createdAt", "updatedAt"
)
SELECT
    "id", "stockNumber", "vin", "year", "make", "model", "mileage",
    "dateIn", "retailPrice", "vehicleCost", "reconCost", "otherCost",
    "color", "status", "createdAt", "updatedAt"
FROM "Vehicle";

DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";

CREATE UNIQUE INDEX "Vehicle_stockNumber_key" ON "Vehicle"("stockNumber");
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");
CREATE INDEX "Vehicle_status_archivedAt_idx" ON "Vehicle"("status", "archivedAt");
CREATE INDEX "Vehicle_dateIn_idx" ON "Vehicle"("dateIn");

PRAGMA foreign_keys=ON;
