"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addLeadActivity(leadId: number, formData: FormData) {
  const type = String(formData.get("type") ?? "Note").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!summary) throw new Error("Activity details are required.");

  await prisma.$transaction([
    prisma.leadActivity.create({ data: { leadId, type, summary } }),
    prisma.lead.update({
      where: { id: leadId },
      data: { lastContactAt: type === "Note" ? undefined : new Date() },
    }),
  ]);

  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/");
}

export async function updateLeadNotes(leadId: number, formData: FormData) {
  const notes = String(formData.get("notes") ?? "").trim() || null;
  await prisma.lead.update({ where: { id: leadId }, data: { notes } });
  await prisma.leadActivity.create({ data: { leadId, type: "Note", summary: "Lead notes updated." } });
  revalidatePath(`/crm/${leadId}`);
}
