import type { Vehicle } from "@/generated/prisma/client";
import { money } from "@/lib/vehicles";

type MarketingVehicle = Pick<
  Vehicle,
  | "year"
  | "make"
  | "model"
  | "trim"
  | "mileage"
  | "retailPrice"
  | "color"
  | "stockNumber"
  | "notes"
>;

function vehicleName(vehicle: MarketingVehicle) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");
}

function priceLine(vehicle: MarketingVehicle) {
  const price = Number(vehicle.retailPrice);
  return price > 0 ? money(price) : "Contact us for pricing";
}

function cleanNotes(notes: string | null) {
  return notes?.trim() || "Clean, dependable, and ready for its next owner.";
}

export function generateVehicleMarketing(vehicle: MarketingVehicle) {
  const name = vehicleName(vehicle);
  const mileage = `${vehicle.mileage.toLocaleString("en-US")} miles`;
  const color = vehicle.color?.trim() ? `${vehicle.color.trim()} exterior` : "great-looking exterior";
  const price = priceLine(vehicle);
  const notes = cleanNotes(vehicle.notes);

  return {
    marketplace: `${name} — ${price}\n\n${mileage} • ${color} • Stock #${vehicle.stockNumber}\n\n${notes}\n\nFinancing options may be available for qualified buyers. Message Reliable Auto Sales to confirm availability, schedule a test drive, or get started.`,
    social: `Now available at Reliable Auto Sales: ${name}. ${mileage}, ${color}, and priced at ${price}. ${notes} Message us today to check availability or schedule a test drive.`,
    website: `${name} available now at Reliable Auto Sales. This vehicle has ${mileage}, a ${color}, and an asking price of ${price}. ${notes} Contact our team for availability, financing information, and a test drive. Stock #${vehicle.stockNumber}.`,
    text: `Hi! The ${name} (Stock #${vehicle.stockNumber}) is currently listed at ${price}. Would you like to schedule a test drive or get financing information?`,
  };
}

export function marketingReadiness(vehicle: MarketingVehicle) {
  const missing = [
    Number(vehicle.retailPrice) <= 0 ? "retail price" : null,
    !vehicle.color?.trim() ? "color" : null,
    !vehicle.trim?.trim() ? "trim" : null,
    !vehicle.notes?.trim() ? "description notes" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    ready: missing.length === 0,
    score: Math.round(((4 - missing.length) / 4) * 100),
    missing,
  };
}
