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

function refreshCrm() {
  revalidatePath("/");
  revalidatePath("/crm");
}

export async function createLead(formData: FormData) {
  const firstName = text(formData, "firstName");
  if (!firstName) throw new Error("First name is required.");
  const phone = text(formData, "phone") || null;
  const email = text(formData, "email") || null;
  if (!phone && !email) throw new Error("Enter a phone number or email address.");

  const vehicleIdRaw = text(formData, "vehicleId");
  await prisma.lead.create({
    data: {
      firstName,
      lastName: text(formData, "lastName") || null,
      phone,
      email,
      source: text(formData, "source") || "Manual",
      priority: text(formData, "priority") || "Warm",
      status: "New",
      vehicleId: vehicleIdRaw ? Number(vehicleIdRaw) : null,
      nextFollowUpAt: optionalDate(formData.get("nextFollowUpAt")),
      appointmentAt: optionalDate(formData.get("appointmentAt")),
      notes: text(formData, "notes") || null,
    },
  });
  refreshCrm();
}

export async function updateLeadStatus(leadId: number, formData: FormData) {
  const status = text(formData, "status");
  const valid = ["New", "Contacted", "Appointment", "Working", "Sold", "Lost"];
  if (!valid.includes(status)) throw new Error("Choose a valid lead status.");

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { respondedAt: true } });
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      respondedAt: status === "New" ? null : lead?.respondedAt ?? new Date(),
      lastContactAt: status === "New" ? undefined : new Date(),
    },
  });
  refreshCrm();
}

export async function completeFollowUp(leadId: number) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { respondedAt: true } });
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      lastContactAt: new Date(),
      respondedAt: lead?.respondedAt ?? new Date(),
      nextFollowUpAt: null,
      status: "Contacted",
    },
  });
  refreshCrm();
}

export async function scheduleFollowUp(leadId: number, formData: FormData) {
  const nextFollowUpAt = optionalDate(formData.get("nextFollowUpAt"));
  if (!nextFollowUpAt) throw new Error("Choose a follow-up date and time.");
  await prisma.lead.update({ where: { id: leadId }, data: { nextFollowUpAt } });
  refreshCrm();
}

export async function archiveLead(leadId: number) {
  await prisma.lead.update({ where: { id: leadId }, data: { archivedAt: new Date() } });
  refreshCrm();
}
