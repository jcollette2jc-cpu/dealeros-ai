import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { applyFollowUpSequence, archiveLead, completeFollowUp, createLead, scheduleFollowUp, updateLeadStatus } from "./actions";

export default async function CrmPage() {
  const now = new Date();
  const [leads, vehicles] = await Promise.all([
    prisma.lead.findMany({
      where: { archivedAt: null },
      include: { vehicle: true },
      orderBy: [{ priority: "asc" }, { nextFollowUpAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.vehicle.findMany({
      where: { archivedAt: null, status: { in: ["Available", "Pending"] } },
      orderBy: [{ year: "desc" }, { make: "asc" }],
    }),
  ]);

  const open = leads.filter((lead) => !["Sold", "Lost"].includes(lead.status));
  const newLeads = open.filter((lead) => lead.status === "New");
  const hotLeads = open.filter((lead) => lead.priority === "Hot");
  const overdue = open.filter((lead) => lead.nextFollowUpAt && lead.nextFollowUpAt < now);
  const unscheduled = open.filter((lead) => !lead.nextFollowUpAt);
  const appointments = open.filter((lead) => lead.appointmentAt && lead.appointmentAt >= now);
  const responded = leads.filter((lead) => lead.respondedAt);
  const averageResponseMinutes = responded.length
    ? Math.round(responded.reduce((sum, lead) => sum + Math.max(0, lead.respondedAt!.getTime() - lead.createdAt.getTime()) / 60000, 0) / responded.length)
    : null;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-blue-400">← DealerOS Dashboard</Link>
            <h1 className="mt-3 text-3xl font-bold">CRM Command Center</h1>
            <p className="mt-2 text-slate-400">Priority-based follow-up scheduling, appointment control, and response-speed protection.</p>
          </div>
          <div className="flex gap-3"><Link href="/reports" className="rounded-lg border border-slate-700 px-5 py-3 text-center text-sm font-semibold">Executive KPIs</Link><a href="#new-lead" className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold hover:bg-blue-500">Add Lead</a></div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="Active Leads" value={String(open.length)} />
          <Metric label="New Leads" value={String(newLeads.length)} tone="text-blue-300" />
          <Metric label="Hot Leads" value={String(hotLeads.length)} tone="text-red-300" />
          <Metric label="Overdue" value={String(overdue.length)} tone="text-yellow-300" />
          <Metric label="Unscheduled" value={String(unscheduled.length)} tone={unscheduled.length ? "text-yellow-300" : "text-green-300"} />
          <Metric label="Avg. Response" value={averageResponseMinutes === null ? "—" : `${averageResponseMinutes} min`} tone={averageResponseMinutes !== null && averageResponseMinutes <= 5 ? "text-green-300" : "text-yellow-300"} />
        </section>

        <section id="new-lead" className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Add a lead</h2>
          <p className="mt-1 text-sm text-slate-400">When no date is selected, DealerOS schedules Hot leads in 1 hour, Warm leads in 24 hours, and Cold leads in 72 hours.</p>
          <form action={createLead} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input name="firstName" placeholder="First name" required />
            <Input name="lastName" placeholder="Last name" />
            <Input name="phone" placeholder="Phone" />
            <Input name="email" type="email" placeholder="Email" />
            <Select name="source" options={["Manual", "Website", "Facebook", "Phone", "Walk-In", "Referral", "DealerClick"]} />
            <Select name="priority" options={["Hot", "Warm", "Cold"]} defaultValue="Warm" />
            <select name="vehicleId" className={inputClass} defaultValue=""><option value="">Open inquiry</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model} · #{vehicle.stockNumber}</option>)}</select>
            <Input name="nextFollowUpAt" type="datetime-local" />
            <Input name="appointmentAt" type="datetime-local" />
            <textarea name="notes" placeholder="Lead notes" className={`${inputClass} min-h-12 md:col-span-2`} />
            <button className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">Save and Schedule</button>
          </form>
        </section>

        <section className="mt-8 space-y-4">
          <div><h2 className="text-xl font-semibold">Lead follow-up queue</h2><p className="mt-1 text-sm text-slate-400">{appointments.length} upcoming appointment{appointments.length === 1 ? "" : "s"}.</p></div>
          {leads.map((lead) => {
            const isOverdue = Boolean(lead.nextFollowUpAt && lead.nextFollowUpAt < now && !["Sold", "Lost"].includes(lead.status));
            return (
              <article key={lead.id} className={`rounded-2xl border bg-slate-900 p-5 ${isOverdue ? "border-yellow-500/50" : "border-slate-800"}`}>
                <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr_1.4fr] xl:items-start">
                  <div><div className="flex flex-wrap items-center gap-2"><Link href={`/crm/${lead.id}`} className="text-lg font-semibold text-blue-300 hover:text-blue-200">{lead.firstName} {lead.lastName}</Link><Badge value={lead.priority} /><span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{lead.status}</span></div><p className="mt-2 text-sm text-slate-400">{lead.phone ?? "No phone"} · {lead.email ?? "No email"}</p><p className="mt-2 text-sm text-slate-300">{lead.vehicle ? `${lead.vehicle.year} ${lead.vehicle.make} ${lead.vehicle.model}` : "Open vehicle inquiry"} · {lead.source}</p>{lead.notes && <p className="mt-3 text-sm text-slate-400">{lead.notes}</p>}<Link href={`/crm/${lead.id}`} className="mt-4 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300">View contact history →</Link></div>
                  <div className="text-sm"><p className={isOverdue ? "font-semibold text-yellow-300" : "text-slate-300"}>Follow-up: {lead.nextFollowUpAt?.toLocaleString() ?? "Not scheduled"}</p><p className="mt-2 text-slate-400">Appointment: {lead.appointmentAt?.toLocaleString() ?? "None"}</p><p className="mt-2 text-slate-500">Last contact: {lead.lastContactAt?.toLocaleString() ?? "None"}</p></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <form action={updateLeadStatus.bind(null, lead.id)} className="flex gap-2 sm:col-span-2"><Select name="status" options={["New", "Contacted", "Appointment", "Working", "Sold", "Lost"]} defaultValue={lead.status} /><button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600">Update</button></form>
                    <form action={scheduleFollowUp.bind(null, lead.id)} className="flex gap-2 sm:col-span-2"><Input name="nextFollowUpAt" type="datetime-local" required /><button className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Schedule</button></form>
                    <form action={applyFollowUpSequence.bind(null, lead.id)}><button className="w-full rounded-lg border border-blue-500/50 px-4 py-2 text-sm font-semibold text-blue-300">Apply Sequence</button></form>
                    <form action={completeFollowUp.bind(null, lead.id)}><button className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500">Complete + Reschedule</button></form>
                    <form action={archiveLead.bind(null, lead.id)} className="sm:col-span-2"><button className="w-full rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10">Archive</button></form>
                  </div>
                </div>
              </article>
            );
          })}
          {leads.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">No leads yet. Add the first lead above.</div>}
        </section>
      </div>
    </main>
  );
}

const inputClass = "min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500";
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={inputClass} />; }
function Select({ name, options, defaultValue }: { name: string; options: string[]; defaultValue?: string }) { return <select name={name} defaultValue={defaultValue ?? options[0]} className={inputClass}>{options.map((option) => <option key={option}>{option}</option>)}</select>; }
function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p></div>; }
function Badge({ value }: { value: string }) { const tone = value === "Hot" ? "bg-red-500/15 text-red-300" : value === "Cold" ? "bg-slate-700 text-slate-300" : "bg-yellow-500/15 text-yellow-300"; return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{value}</span>; }
