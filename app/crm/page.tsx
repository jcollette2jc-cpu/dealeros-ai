import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CrmPage() {
  const now = new Date();
  const leads = await prisma.lead.findMany({
    where: { archivedAt: null },
    include: { vehicle: true },
    orderBy: [{ priority: "asc" }, { nextFollowUpAt: "asc" }, { createdAt: "desc" }],
  });

  const newLeads = leads.filter((lead) => lead.status === "New");
  const hotLeads = leads.filter((lead) => lead.priority === "Hot");
  const overdue = leads.filter((lead) => lead.nextFollowUpAt && lead.nextFollowUpAt < now && !["Sold", "Lost"].includes(lead.status));
  const appointments = leads.filter((lead) => lead.appointmentAt && lead.appointmentAt >= now);
  const responded = leads.filter((lead) => lead.respondedAt);
  const averageResponseMinutes = responded.length
    ? Math.round(responded.reduce((sum, lead) => sum + Math.max(0, lead.respondedAt!.getTime() - lead.createdAt.getTime()) / 60000, 0) / responded.length)
    : null;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-blue-400">← DealerOS Dashboard</Link>
            <h1 className="mt-3 text-3xl font-bold">CRM Command Center</h1>
            <p className="mt-2 text-slate-400">Live lead priorities, response speed, appointments, and follow-up risk.</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Active Leads" value={String(leads.length)} />
          <Metric label="New Leads" value={String(newLeads.length)} tone="text-blue-300" />
          <Metric label="Hot Leads" value={String(hotLeads.length)} tone="text-red-300" />
          <Metric label="Overdue Follow-Ups" value={String(overdue.length)} tone="text-yellow-300" />
          <Metric label="Avg. Response" value={averageResponseMinutes === null ? "—" : `${averageResponseMinutes} min`} tone={averageResponseMinutes !== null && averageResponseMinutes <= 5 ? "text-green-300" : "text-yellow-300"} />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-xl font-semibold">Lead follow-up queue</h2>
            <p className="mt-1 text-sm text-slate-400">{appointments.length} upcoming appointment{appointments.length === 1 ? "" : "s"}.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-400">
                <tr>{["Customer", "Priority", "Status", "Vehicle", "Source", "Next Follow-Up", "Appointment"].map((heading) => <th key={heading} className="px-5 py-4">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-800">
                    <td className="px-5 py-4"><p className="font-semibold">{lead.firstName} {lead.lastName}</p><p className="mt-1 text-xs text-slate-500">{lead.phone ?? lead.email ?? "No contact entered"}</p></td>
                    <td className="px-5 py-4"><Badge value={lead.priority} /></td>
                    <td className="px-5 py-4 text-slate-300">{lead.status}</td>
                    <td className="px-5 py-4 text-slate-300">{lead.vehicle ? `${lead.vehicle.year} ${lead.vehicle.make} ${lead.vehicle.model}` : "Open inquiry"}</td>
                    <td className="px-5 py-4 text-slate-300">{lead.source}</td>
                    <td className={`px-5 py-4 ${lead.nextFollowUpAt && lead.nextFollowUpAt < now ? "font-semibold text-yellow-300" : "text-slate-300"}`}>{lead.nextFollowUpAt?.toLocaleString() ?? "Not scheduled"}</td>
                    <td className="px-5 py-4 text-slate-300">{lead.appointmentAt?.toLocaleString() ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && <div className="p-12 text-center text-slate-400">No leads yet. The CRM model is ready for lead capture and DealerClick or website integrations.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p></div>; }
function Badge({ value }: { value: string }) { const tone = value === "Hot" ? "bg-red-500/15 text-red-300" : value === "Cold" ? "bg-slate-700 text-slate-300" : "bg-yellow-500/15 text-yellow-300"; return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{value}</span>; }