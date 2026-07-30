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

function refreshCrm(leadId?: number) {
  revalidatePath("/");
  revalidatePath("/crm");
  revalidatePath("/reports");
  if (leadId) revalidatePath(`/crm/${leadId}`);
}

function sequenceDelayHours(priority: string) {
  if (priority === "Hot") return 1;
  if (priority === "Cold") return 72;
  return 24;
}

export async function createLead(formData: FormData) {
  const firstName = text(formData, "firstName");
  if (!firstName) throw new Error("First name is required.");
  const phone = text(formData, "phone") || null;
  const email = text(formData, "email") || null;
  if (!phone && !email) throw new Error("Enter a phone number or email address.");

  const priority = text(formData, "priority") || "Warm";
  const vehicleIdRaw = text(formData, "vehicleId");
  const explicitFollowUp = optionalDate(formData.get("nextFollowUpAt"));
  const automaticFollowUp = new Date(Date.now() + sequenceDelayHours(priority) * 60 * 60 * 1000);
  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName: text(formData, "lastName") || null,
      phone,
      email,
      source: text(formData, "source") || "Manual",
      priority,
      status: "New",
      vehicleId: vehicleIdRaw ? Number(vehicleIdRaw) : null,
      nextFollowUpAt: explicitFollowUp ?? automaticFollowUp,
      appointmentAt: optionalDate(formData.get("appointmentAt")),
      notes: text(formData, "notes") || null,
      activities: {
        create: {
          type: "Automation",
          summary: `Initial ${priority.toLowerCase()} lead follow-up scheduled within ${sequenceDelayHours(priority)} hour${sequenceDelayHours(priority) === 1 ? "" : "s"}.`,
        },
      },
    },
  });
  refreshCrm(lead.id);
}

export async function applyFollowUpSequence(leadId: number) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { priority: true, status: true } });
  if (!lead || ["Sold", "Lost"].includes(lead.status)) throw new Error("This lead cannot receive a follow-up sequence.");
  const hours = sequenceDelayHours(lead.priority);
  const nextFollowUpAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.lead.update({ where: { id: leadId }, data: { nextFollowUpAt } }),
    prisma.leadActivity.create({ data: { leadId, type: "Automation", summary: `${lead.priority} follow-up sequence applied. Next task due in ${hours} hour${hours === 1 ? "" : "s"}.` } }),
  ]);
  refreshCrm(leadId);
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
  refreshCrm(leadId);
}

export async function completeFollowUp(leadId: number) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { respondedAt: true, priority: true } });
  const nextFollowUpAt = lead ? new Date(Date.now() + sequenceDelayHours(lead.priority) * 60 * 60 * 1000) : null;
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        lastContactAt: new Date(),
        respondedAt: lead?.respondedAt ?? new Date(),
        nextFollowUpAt,
        status: "Contacted",
      },
    }),
    prisma.leadActivity.create({ data: { leadId, type: "Follow-Up", summary: "Follow-up completed and the next priority-based task was scheduled." } }),
  ]);
  refreshCrm(leadId);
}

export async function scheduleFollowUp(leadId: number, formData: FormData) {
  const nextFollowUpAt = optionalDate(formData.get("nextFollowUpAt"));
  if (!nextFollowUpAt) throw new Error("Choose a follow-up date and time.");
  await prisma.lead.update({ where: { id: leadId }, data: { nextFollowUpAt } });
  refreshCrm(leadId);
}

export async function archiveLead(leadId: number) {
  await prisma.lead.update({ where: { id: leadId }, data: { archivedAt: new Date() } });
  refreshCrm(leadId);
}
