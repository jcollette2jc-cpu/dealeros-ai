import type { Vehicle } from "@/generated/prisma/client";

export const VEHICLE_STATUSES = [
  "Available",
  "Pending",
  "Sold",
  "Wholesale",
] as const;

export function daysInStock(dateIn: Date | null, now = new Date()) {
  if (!dateIn) return 0;
  return Math.max(
    0,
    Math.floor((now.getTime() - dateIn.getTime()) / 86_400_000),
  );
}

export function totalCost(
  vehicle: Pick<Vehicle, "vehicleCost" | "reconCost" | "otherCost">,
) {
  return (
    Number(vehicle.vehicleCost) +
    Number(vehicle.reconCost) +
    Number(vehicle.otherCost)
  );
}

export function estimatedGross(
  vehicle: Pick<
    Vehicle,
    "retailPrice" | "vehicleCost" | "reconCost" | "otherCost"
  >,
) {
  return Number(vehicle.retailPrice) - totalCost(vehicle);
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function recommendation(age: number, retailPrice: number) {
  if (!retailPrice) return "Enter retail price";
  if (age > 120) return "Urgent pricing review";
  if (age > 90) return "Reprice and advertise";
  if (age > 60) return "Refresh marketing";
  return "Monitor performance";
}
