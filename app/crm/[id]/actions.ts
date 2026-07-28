"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid date and time.");
  return date;
}

export async function addLeadActivity(leadId: number, formData: FormData) {
  const type = String(formData.get("type") ?? "Note").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!summary) throw new Error("Activity details are required.");

  await prisma.$transaction([
    prisma.leadActivity.create({ data: { leadId, type, summary } }),
    prisma.lead.update({ where: { id: leadId }, data: { lastContactAt: type === "Note" ? undefined : new Date() } }),
  ]);
  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/");
}

export async function updateLeadDetails(leadId: number, formData: FormData) {
  const firstName = text(formData, "firstName");
  const phone = text(formData, "phone") || null;
  const email = text(formData, "email") || null;
  const priority = text(formData, "priority");
  const status = text(formData, "status");
  if (!firstName) throw new Error("First name is required.");
  if (!phone && !email) throw new Error("Enter a phone number or email address.");
  if (!["Hot", "Warm", "Cold"].includes(priority)) throw new Error("Choose a valid priority.");
  if (!["New", "Contacted", "Appointment", "Working", "Sold", "Lost"].includes(status)) throw new Error("Choose a valid status.");

  const vehicleIdRaw = text(formData, "vehicleId");
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        firstName,
        lastName: text(formData, "lastName") || null,
        phone,
        email,
        source: text(formData, "source") || "Manual",
        priority,
        status,
        vehicleId: vehicleIdRaw ? Number(vehicleIdRaw) : null,
        nextFollowUpAt: optionalDate(formData.get("nextFollowUpAt")),
        appointmentAt: optionalDate(formData.get("appointmentAt")),
        notes: text(formData, "notes") || null,
        respondedAt: status === "New" ? null : undefined,
      },
    }),
    prisma.leadActivity.create({ data: { leadId, type: "Note", summary: "Lead details updated." } }),
  ]);
  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/");
}
