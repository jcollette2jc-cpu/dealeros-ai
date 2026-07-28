"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CHANNELS = ["marketplace", "social", "website", "text"] as const;
const STATUSES = ["Draft", "Approved"] as const;

export async function setMarketingApproval(
  vehicleId: number,
  channel: string,
  status: string,
) {
  if (!CHANNELS.includes(channel as (typeof CHANNELS)[number])) {
    throw new Error("Unsupported marketing channel.");
  }
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Error("Unsupported approval status.");
  }

  await prisma.marketingApproval.upsert({
    where: { vehicleId_channel: { vehicleId, channel } },
    update: {
      status,
      approvedAt: status === "Approved" ? new Date() : null,
    },
    create: {
      vehicleId,
      channel,
      status,
      approvedAt: status === "Approved" ? new Date() : null,
    },
  });

  revalidatePath(`/inventory/${vehicleId}`);
}