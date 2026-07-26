"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { VEHICLE_STATUSES } from "@/lib/vehicles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type VehicleFormState = {
  error?: string;
  fields?: Record<string, string>;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  const raw = text(formData, key);
  return raw === "" ? 0 : Number(raw);
}

function values(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  );
}

function parseVehicle(formData: FormData) {
  const year = numberValue(formData, "year");
  const mileage = numberValue(formData, "mileage");
  const status = text(formData, "status");
  const vin = text(formData, "vin").toUpperCase().replace(/\s/g, "");
  const stockNumber = text(formData, "stockNumber");
  const make = text(formData, "make");
  const model = text(formData, "model");
  const dateInRaw = text(formData, "dateIn");
  const currentYear = new Date().getFullYear() + 1;

  if (!stockNumber || !vin || !make || !model || !year) {
    throw new Error("Stock number, VIN, year, make, and model are required.");
  }
  if (vin.length < 6 || vin.length > 17 || !/^[A-Z0-9]+$/.test(vin)) {
    throw new Error("VIN or serial number must be 6–17 letters and numbers.");
  }
  if (vin.length === 17 && /[IOQ]/.test(vin)) {
    throw new Error("A 17-character automotive VIN cannot contain I, O, or Q.");
  }
  if (year < 1900 || year > currentYear) {
    throw new Error(`Year must be between 1900 and ${currentYear}.`);
  }
  if (mileage < 0) throw new Error("Mileage cannot be negative.");
  if (!VEHICLE_STATUSES.includes(status as (typeof VEHICLE_STATUSES)[number])) {
    throw new Error("Choose a valid vehicle status.");
  }

  for (const field of ["retailPrice", "vehicleCost"]) {
    if (numberValue(formData, field) < 0) {
      throw new Error("Retail price and vehicle cost cannot be negative.");
    }
  }
  for (const field of ["reconCost", "otherCost"]) {
    if (!Number.isFinite(numberValue(formData, field))) {
      throw new Error("Recon and other cost adjustments must be valid numbers.");
    }
  }

  return {
    stockNumber,
    vin,
    year,
    make,
    model,
    trim: text(formData, "trim") || null,
    mileage,
    dateIn: dateInRaw ? new Date(`${dateInRaw}T12:00:00`) : null,
    retailPrice: numberValue(formData, "retailPrice"),
    vehicleCost: numberValue(formData, "vehicleCost"),
    reconCost: numberValue(formData, "reconCost"),
    otherCost: numberValue(formData, "otherCost"),
    color: text(formData, "color") || null,
    status,
    notes: text(formData, "notes") || null,
  };
}

function friendlyError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "That VIN or stock number already exists.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function createVehicle(
  _state: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  try {
    await prisma.vehicle.create({ data: parseVehicle(formData) });
  } catch (error) {
    return { error: friendlyError(error), fields: values(formData) };
  }
  revalidatePath("/");
  revalidatePath("/inventory");
  redirect("/inventory?success=created");
}

export async function updateVehicle(
  id: number,
  _state: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  try {
    await prisma.vehicle.update({
      where: { id, archivedAt: null },
      data: parseVehicle(formData),
    });
  } catch (error) {
    return { error: friendlyError(error), fields: values(formData) };
  }
  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  redirect(`/inventory/${id}?success=updated`);
}

export async function changeVehicleStatus(id: number, formData: FormData) {
  const status = text(formData, "status");
  if (!VEHICLE_STATUSES.includes(status as (typeof VEHICLE_STATUSES)[number])) {
    throw new Error("Invalid vehicle status.");
  }
  await prisma.vehicle.update({
    where: { id, archivedAt: null },
    data: { status },
  });
  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
}

export async function archiveVehicle(id: number) {
  await prisma.vehicle.update({
    where: { id, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/inventory");
  redirect("/inventory?success=archived");
}
