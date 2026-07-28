import { prisma } from "@/lib/prisma";
import { generateVehicleMarketing } from "@/lib/marketing";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    where: { archivedAt: null, status: "Available" },
    orderBy: [{ dateIn: "desc" }, { createdAt: "desc" }],
  });

  const inventory = vehicles.map((vehicle) => {
    const marketing = generateVehicleMarketing(vehicle);
    return {
      id: vehicle.id,
      stockNumber: vehicle.stockNumber,
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      mileage: vehicle.mileage,
      color: vehicle.color,
      price: Number(vehicle.retailPrice),
      currency: "USD",
      status: vehicle.status,
      dateIn: vehicle.dateIn?.toISOString() ?? null,
      description: marketing.website,
      updatedAt: vehicle.updatedAt.toISOString(),
      schema: {
        "@context": "https://schema.org",
        "@type": "Vehicle",
        name: [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" "),
        vehicleIdentificationNumber: vehicle.vin,
        mileageFromOdometer: {
          "@type": "QuantitativeValue",
          value: vehicle.mileage,
          unitCode: "SMI",
        },
        color: vehicle.color,
        offers: Number(vehicle.retailPrice) > 0 ? {
          "@type": "Offer",
          price: Number(vehicle.retailPrice),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "AutoDealer",
            name: "Reliable Auto Sales",
          },
        } : undefined,
      },
    };
  });

  return NextResponse.json(
    {
      dealership: "Reliable Auto Sales",
      generatedAt: new Date().toISOString(),
      count: inventory.length,
      inventory,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}