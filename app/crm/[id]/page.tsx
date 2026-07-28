import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addLeadActivity, updateLeadNotes } from "./actions";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id: Number(id), archivedAt: null },
    include: { vehicle: true, activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) notFound();
  const activityAction = addLeadActivity.bind(null, lead.id);
  const notesAction = updateLeadNotes.bind(null, lead.id);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/crm" className="text-sm text-blue-400">← CRM Command Center</Link>
        <header className="mt-6 border-b border-slate-800 pb-6">
          <p className="text-sm text-blue-400">{lead.priority} lead · {lead.source}</p>
          <h1 className="mt-2 text-3xl font-bold">{lead.firstName} {lead.lastName}</h1>
          <p className="mt-2 text-slate-400">{lead.phone ?? "No phone"} · {lead.email ?? "No email"}</p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Lead details</h2>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <Detail label="Status" value={lead.status} />
              <Detail label="Priority" value={lead.priority} />
              <Detail label="Vehicle" value={lead.vehicle ? `${lead.vehicle.year} ${lead.vehicle.make} ${lead.vehicle.model}` : "Open inquiry"} />
              <Detail label="Next follow-up" value={lead.nextFollowUpAt?.toLocaleString() ?? "Not scheduled"} />
              <Detail label="Appointment" value={lead.appointmentAt?.toLocaleString() ?? "Not scheduled"} />
              <Detail label="Last contact" value={lead.lastContactAt?.toLocaleString() ?? "No contact logged"} />
            </dl>
            <form action={notesAction} className="mt-6 border-t border-slate-800 pt-5">
              <label className="text-sm font-medium">Internal notes</label>
              <textarea name="notes" defaultValue={lead.notes ?? ""} rows={5} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm" />
              <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold">Save Notes</button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Log customer contact</h2>
            <form action={activityAction} className="mt-5 space-y-4">
              <select name="type" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3">
                {['Phone Call','Text Message','Email','Appointment','Note'].map((type) => <option key={type}>{type}</option>)}
              </select>
              <textarea name="summary" required rows={4} placeholder="What happened and what is the next step?" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm" />
              <button className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold">Add Activity</button>
            </form>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Contact history</h2>
          <div className="mt-5 space-y-4">
            {lead.activities.map((activity) => <div key={activity.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="flex justify-between gap-4"><p className="font-semibold text-blue-300">{activity.type}</p><p className="text-xs text-slate-500">{activity.createdAt.toLocaleString()}</p></div><p className="mt-2 text-sm text-slate-300">{activity.summary}</p></div>)}
            {lead.activities.length === 0 && <p className="text-slate-400">No activity has been logged yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
