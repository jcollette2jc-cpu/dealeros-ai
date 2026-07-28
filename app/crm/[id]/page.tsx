import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addLeadActivity, updateLeadDetails } from "./actions";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, vehicles] = await Promise.all([
    prisma.lead.findFirst({
      where: { id: Number(id), archivedAt: null },
      include: { vehicle: true, activities: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.vehicle.findMany({
      where: { archivedAt: null, status: { in: ["Available", "Pending"] } },
      orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
    }),
  ]);
  if (!lead) notFound();
  const activityAction = addLeadActivity.bind(null, lead.id);
  const detailsAction = updateLeadDetails.bind(null, lead.id);
  const input = "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm";
  const dateValue = (date: Date | null) => date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

  return <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10"><div className="mx-auto max-w-6xl">
    <Link href="/crm" className="text-sm text-blue-400">← CRM Command Center</Link>
    <header className="mt-6 border-b border-slate-800 pb-6"><p className="text-sm text-blue-400">{lead.priority} lead · {lead.source}</p><h1 className="mt-2 text-3xl font-bold">{lead.firstName} {lead.lastName}</h1><p className="mt-2 text-slate-400">{lead.phone ?? "No phone"} · {lead.email ?? "No email"}</p></header>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <form action={detailsAction} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Edit lead</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="First name"><input name="firstName" defaultValue={lead.firstName} required className={input} /></Field>
          <Field label="Last name"><input name="lastName" defaultValue={lead.lastName ?? ""} className={input} /></Field>
          <Field label="Phone"><input name="phone" defaultValue={lead.phone ?? ""} className={input} /></Field>
          <Field label="Email"><input name="email" type="email" defaultValue={lead.email ?? ""} className={input} /></Field>
          <Field label="Source"><select name="source" defaultValue={lead.source} className={input}>{["Manual","Website","Facebook","Phone","Walk-In","Referral","DealerClick"].map((value) => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Priority"><select name="priority" defaultValue={lead.priority} className={input}>{["Hot","Warm","Cold"].map((value) => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Status"><select name="status" defaultValue={lead.status} className={input}>{["New","Contacted","Appointment","Working","Sold","Lost"].map((value) => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Vehicle interest"><select name="vehicleId" defaultValue={lead.vehicleId ?? ""} className={input}><option value="">Open inquiry</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model} · #{vehicle.stockNumber}</option>)}</select></Field>
          <Field label="Next follow-up"><input name="nextFollowUpAt" type="datetime-local" defaultValue={dateValue(lead.nextFollowUpAt)} className={input} /></Field>
          <Field label="Appointment"><input name="appointmentAt" type="datetime-local" defaultValue={dateValue(lead.appointmentAt)} className={input} /></Field>
        </div>
        <Field label="Internal notes"><textarea name="notes" defaultValue={lead.notes ?? ""} rows={5} className={input} /></Field>
        <button className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold">Save Lead Changes</button>
      </form>

      <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Log customer contact</h2>
        <form action={activityAction} className="mt-5 space-y-4"><select name="type" className={input}>{["Phone Call","Text Message","Email","Appointment","Note"].map((type) => <option key={type}>{type}</option>)}</select><textarea name="summary" required rows={5} placeholder="What happened and what is the next step?" className={input} /><button className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold">Add Activity</button></form>
        <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800 pt-5 text-sm"><Detail label="Created" value={lead.createdAt.toLocaleString()} /><Detail label="Last contact" value={lead.lastContactAt?.toLocaleString() ?? "None"} /><Detail label="Next follow-up" value={lead.nextFollowUpAt?.toLocaleString() ?? "None"} /><Detail label="Appointment" value={lead.appointmentAt?.toLocaleString() ?? "None"} /></dl>
      </article>
    </section>

    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Contact history</h2><div className="mt-5 space-y-4">{lead.activities.map((activity) => <div key={activity.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="flex justify-between gap-4"><p className="font-semibold text-blue-300">{activity.type}</p><p className="text-xs text-slate-500">{activity.createdAt.toLocaleString()}</p></div><p className="mt-2 text-sm text-slate-300">{activity.summary}</p></div>)}{lead.activities.length === 0 && <p className="text-slate-400">No activity has been logged yet.</p>}</div></section>
  </div></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mt-4 block text-sm font-medium"><span className="mb-2 block text-slate-300">{label}</span>{children}</label>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
