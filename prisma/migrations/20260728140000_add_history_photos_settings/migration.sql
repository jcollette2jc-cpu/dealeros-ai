CREATE TABLE "VehiclePhoto" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "vehicleId" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "VehiclePhoto_vehicleId_position_idx" ON "VehiclePhoto"("vehicleId", "position");

CREATE TABLE "LeadActivity" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "leadId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");

CREATE TABLE "DealershipSettings" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
  "name" TEXT NOT NULL DEFAULT 'Reliable Auto Sales',
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "streetAddress" TEXT NOT NULL DEFAULT '9423 Lima Rd.',
  "city" TEXT NOT NULL DEFAULT 'Fort Wayne',
  "state" TEXT NOT NULL DEFAULT 'IN',
  "postalCode" TEXT,
  "financingDisclosure" TEXT NOT NULL DEFAULT 'Financing options may be available for qualified buyers.',
  "updatedAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "DealershipSettings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP);
