"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addVehiclePhoto(vehicleId: number, formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  const altText = String(formData.get("altText") ?? "").trim() || null;
  if (!/^https?:\/\//i.test(url)) throw new Error("Enter a valid image URL.");
  const count = await prisma.vehiclePhoto.count({ where: { vehicleId } });
  await prisma.vehiclePhoto.create({ data: { vehicleId, url, altText, position: count, isPrimary: count === 0 } });
  revalidatePath(`/inventory/${vehicleId}`);
  revalidatePath(`/inventory/${vehicleId}/photos`);
  revalidatePath("/vehicles");
}

export async function setPrimaryPhoto(vehicleId: number, photoId: number) {
  await prisma.$transaction([
    prisma.vehiclePhoto.updateMany({ where: { vehicleId }, data: { isPrimary: false } }),
    prisma.vehiclePhoto.update({ where: { id: photoId }, data: { isPrimary: true } }),
  ]);
  revalidatePath(`/inventory/${vehicleId}`);
  revalidatePath(`/inventory/${vehicleId}/photos`);
  revalidatePath("/vehicles");
}

export async function deleteVehiclePhoto(vehicleId: number, photoId: number) {
  const photo = await prisma.vehiclePhoto.findUnique({ where: { id: photoId } });
  await prisma.vehiclePhoto.delete({ where: { id: photoId } });
  if (photo?.isPrimary) {
    const next = await prisma.vehiclePhoto.findFirst({ where: { vehicleId }, orderBy: { position: "asc" } });
    if (next) await prisma.vehiclePhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  revalidatePath(`/inventory/${vehicleId}`);
  revalidatePath(`/inventory/${vehicleId}/photos`);
  revalidatePath("/vehicles");
}
