import "dotenv/config";
import { strict as assert } from "node:assert";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { daysInStock, estimatedGross, totalCost } from "../lib/vehicles";

async function main() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const prisma = new PrismaClient({ adapter });
  const vin = "1HGCM82633A654321";
  const stockNumber = "SMOKE-001";

  try {
    await prisma.vehicle.deleteMany({ where: { OR: [{ vin }, { stockNumber }] } });

    const created = await prisma.vehicle.create({
      data: {
        stockNumber,
        vin,
        year: 2020,
        make: "Honda",
        model: "Accord",
        mileage: 50000,
        dateIn: new Date("2026-06-01T12:00:00Z"),
        retailPrice: 22000,
        vehicleCost: 16000,
        reconCost: 750,
        otherCost: 250,
        status: "Available",
      },
    });

    assert.equal(created.vin, vin);
    assert.equal(totalCost(created), 17000);
    assert.equal(estimatedGross(created), 5000);
    assert.ok(daysInStock(created.dateIn) >= 0);

    const found = await prisma.vehicle.findUnique({ where: { vin } });
    assert.ok(found, "Created vehicle could not be read back");

    const updated = await prisma.vehicle.update({
      where: { id: created.id },
      data: { mileage: 50500, status: "Pending" },
    });
    assert.equal(updated.mileage, 50500);
    assert.equal(updated.status, "Pending");

    const archived = await prisma.vehicle.update({
      where: { id: created.id },
      data: { archivedAt: new Date() },
    });
    assert.ok(archived.archivedAt, "Vehicle was not archived");

    const active = await prisma.vehicle.findFirst({
      where: { id: created.id, archivedAt: null },
    });
    assert.equal(active, null, "Archived vehicle remained in active inventory");

    await prisma.vehicle.delete({ where: { id: created.id } });
    console.log("Inventory CRUD smoke test passed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
