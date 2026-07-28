"use server";

import { prisma } from "@/lib/prisma";
import { VEHICLE_STATUSES } from "@/lib/vehicles";
import { revalidatePath } from "next/cache";

export type ImportRow = Partial<Record<string, string>>;
export type ImportResult = {
  created: number;
  updated: number;
  photos: number;
  leads: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

function numberValue(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function validate(row: ImportRow, rowNumber: number) {
  const vin = (row.vin ?? "").toUpperCase().replace(/\s/g, "");
  const stockNumber = (row.stockNumber ?? "").trim();
  const year = numberValue(row.year);
  if (!stockNumber) throw new Error(`Row ${rowNumber}: Stock number is required.`);
  if (vin.length < 6 || vin.length > 17 || !/^[A-Z0-9]+$/.test(vin)) throw new Error(`Row ${rowNumber}: VIN or serial number must be 6–17 letters and numbers.`);
  if (vin.length === 17 && /[IOQ]/.test(vin)) throw new Error(`Row ${rowNumber}: A 17-character automotive VIN cannot contain I, O, or Q.`);
  if (!year || year < 1900 || year > new Date().getFullYear() + 1) throw new Error(`Row ${rowNumber}: Vehicle year is invalid.`);
  if (!row.make?.trim() || !row.model?.trim()) throw new Error(`Row ${rowNumber}: Make and model are required.`);
  const status = row.status?.trim() || "Available";
  if (!VEHICLE_STATUSES.includes(status as (typeof VEHICLE_STATUSES)[number])) throw new Error(`Row ${rowNumber}: Status "${status}" is not supported.`);
  for (const field of ["mileage", "retailPrice", "vehicleCost"] as const) if (numberValue(row[field]) < 0 || Number.isNaN(numberValue(row[field]))) throw new Error(`Row ${rowNumber}: ${field} is invalid.`);
  for (const field of ["reconCost", "otherCost"] as const) if (Number.isNaN(numberValue(row[field]))) throw new Error(`Row ${rowNumber}: ${field} is invalid.`);
  const dateIn = row.dateIn?.trim() ? new Date(row.dateIn) : null;
  if (dateIn && Number.isNaN(dateIn.getTime())) throw new Error(`Row ${rowNumber}: Date acquired is invalid.`);

  return {
    vehicle: {
      stockNumber, vin, year, make: row.make.trim(), model: row.model.trim(),
      trim: row.trim?.trim() || null, mileage: numberValue(row.mileage),
      dateIn, retailPrice: numberValue(row.retailPrice), vehicleCost: numberValue(row.vehicleCost),
      reconCost: numberValue(row.reconCost), otherCost: numberValue(row.otherCost),
      color: row.color?.trim() || null, status, notes: row.notes?.trim() || null, archivedAt: null,
    },
    photoUrl: row.photoUrl?.trim() || null,
    lead: {
      firstName: row.customerFirstName?.trim() || null,
      lastName: row.customerLastName?.trim() || null,
      phone: row.customerPhone?.trim() || null,
      email: row.customerEmail?.trim() || null,
      source: row.leadSource?.trim() || "DealerClick",
      status: row.leadStatus?.trim() || "New",
      priority: row.leadPriority?.trim() || "Warm",
    },
  };
}

export async function importVehicles(rows: ImportRow[]): Promise<ImportResult> {
  const empty = { created: 0, updated: 0, photos: 0, leads: 0, skipped: 0, errors: [] as { row: number; message: string }[] };
  if (!Array.isArray(rows) || rows.length === 0) return { ...empty, errors: [{ row: 0, message: "No rows were provided." }] };
  if (rows.length > 2000) return { ...empty, skipped: rows.length, errors: [{ row: 0, message: "Imports are limited to 2,000 vehicles at a time." }] };

  const result: ImportResult = { ...empty };
  for (let index = 0; index < rows.length; index += 1) {
    try {
      const parsed = validate(rows[index], index + 2);
      const existing = await prisma.vehicle.findFirst({ where: { OR: [{ vin: parsed.vehicle.vin }, { stockNumber: parsed.vehicle.stockNumber }] } });
      const vehicle = existing
        ? await prisma.vehicle.update({ where: { id: existing.id }, data: parsed.vehicle })
        : await prisma.vehicle.create({ data: parsed.vehicle });
      existing ? result.updated += 1 : result.created += 1;

      if (parsed.photoUrl && /^https?:\/\//i.test(parsed.photoUrl)) {
        const duplicate = await prisma.vehiclePhoto.findFirst({ where: { vehicleId: vehicle.id, url: parsed.photoUrl } });
        if (!duplicate) {
          const count = await prisma.vehiclePhoto.count({ where: { vehicleId: vehicle.id } });
          await prisma.vehiclePhoto.create({ data: { vehicleId: vehicle.id, url: parsed.photoUrl, position: count, isPrimary: count === 0 } });
          result.photos += 1;
        }
      }

      if (parsed.lead.firstName && (parsed.lead.phone || parsed.lead.email)) {
        const duplicateLead = await prisma.lead.findFirst({
          where: {
            archivedAt: null,
            OR: [
              ...(parsed.lead.email ? [{ email: parsed.lead.email }] : []),
              ...(parsed.lead.phone ? [{ phone: parsed.lead.phone }] : []),
            ],
            vehicleId: vehicle.id,
          },
        });
        if (!duplicateLead) {
          await prisma.lead.create({ data: { ...parsed.lead, firstName: parsed.lead.firstName, vehicleId: vehicle.id } });
          result.leads += 1;
        }
      }
    } catch (error) {
      result.skipped += 1;
      result.errors.push({ row: index + 2, message: error instanceof Error ? error.message : "Unknown import error." });
    }
  }
  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/crm");
  revalidatePath("/vehicles");
  return result;
}
