import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

async function main() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  const vehicles = [
    {
      stockNumber: "034449",
      vin: "YV4A22PK1G1034449",
      year: 2016,
      make: "Volvo",
      model: "XC90",
      mileage: 114500,
      dateIn: new Date("2026-01-01T12:00:00"),
      retailPrice: 14355,
      vehicleCost: 10879,
      status: "Available",
    },
    {
      stockNumber: "D00017",
      vin: "1FTFX1EF3BKD00017",
      year: 2011,
      make: "Ford",
      model: "F-150",
      mileage: 144028,
      dateIn: new Date("2026-03-20T12:00:00"),
      retailPrice: 13859,
      vehicleCost: 5980,
      status: "Available",
    },
  ];

  try {
    for (const vehicle of vehicles) {
      await prisma.vehicle.upsert({
        where: { vin: vehicle.vin },
        update: {},
        create: vehicle,
      });
    }
    console.log("Demonstration inventory seeded.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
