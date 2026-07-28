"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveDealershipSettings(formData: FormData) {
  const value = (key: string) => String(formData.get(key) ?? "").trim();
  const name = value("name");
  if (!name) throw new Error("Dealership name is required.");

  await prisma.dealershipSettings.upsert({
    where: { id: 1 },
    update: {
      name,
      phone: value("phone") || null,
      email: value("email") || null,
      website: value("website") || null,
      streetAddress: value("streetAddress"),
      city: value("city"),
      state: value("state"),
      postalCode: value("postalCode") || null,
      financingDisclosure: value("financingDisclosure"),
    },
    create: {
      id: 1,
      name,
      phone: value("phone") || null,
      email: value("email") || null,
      website: value("website") || null,
      streetAddress: value("streetAddress"),
      city: value("city"),
      state: value("state"),
      postalCode: value("postalCode") || null,
      financingDisclosure: value("financingDisclosure"),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/vehicles");
  revalidatePath("/api/inventory");
}
