import { prisma } from "@/lib/prisma";
import { daysInStock, estimatedGross, money, totalCost } from "@/lib/vehicles";
import Link from "next/link";

export default async function ReportsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [vehicles, leads] = await Promise.all([
    prisma.vehicle.findMany({ where: { archivedAt: null }, include: { photos: true } }),
    prisma.lead.findMany({ where: { archivedAt: null } }),
  ]);

  const available = vehicles.filter((vehicle) => vehicle.status === "Available");
  const sold = vehicles.filter((vehicle) => vehicle.status === "Sold");
  const recentLeads = leads.filter((lead) => lead.createdAt >= thirtyDaysAgo);
  const responded = recentLeads.filter((lead) => lead.respondedAt);
  const appointments = recentLeads.filter((lead) => lead.appointmentAt);
  const won = recentLeads.filter((lead) => lead.status === "Sold");
  const overdue = leads.filter((lead) => !["Sold", "Lost"].includes(lead.status) && lead.nextFollowUpAt && lead.nextFollowUpAt < now);
  const responseMinutes = responded.length ? Math.round(responded.reduce((sum, lead) => sum + Math.max(0, lead.respondedAt!.getTime() - lead.createdAt.getTime()) / 60000, 0) / responded.length) : null;
  const appointmentRate = recentLeads.length ? Math.round((appointments.length / recentLeads.length) * 100) : 0;
  const closeRate = recentLeads.length ? Math.round((won.length / recentLeads.length) * 100) : 0;
  const aging60 = available.filter((vehicle) => daysInStock(vehicle.dateIn) > 60);
  const aging90 = available.filter((vehicle) => daysInStock(vehicle.dateIn) > 90);
  const marketReady = available.filter((vehicle) => Number(vehicle.retailPrice) > 0 && vehicle.color?.trim() && vehicle.notes?.trim() && vehicle.photos.length >= 12);
  const readiness = available.length ? Math.round((marketReady.length / available.length) * 100) : 100;
  const inventoryCost = available.reduce((sum, vehicle) => sum + totalCost(vehicle), 0);
  const projectedGross = available.reduce((sum, vehicle) => sum + Math.max(0, estimatedGross(vehicle)), 0);
  const averageGross = available.length ? projectedGross / available.length : 0;

  return <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10"><div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between"><div><Link href="/" className="text-sm text-blue-400">← DealerOS Dashboard</Link><h1 className="mt-3 text-3xl font-bold">Executive KPI Report</h1><p className="mt-2 text-slate-400">Owner-level sales, inventory, and execution performance from live DealerOS data.</p></div><div className="flex gap-3"><Link href="/crm" className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold">CRM</Link><Link href="/inventory/quality" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold">Quality Review</Link></div></header>

    <section className="mt-8"><h2 className="text-lg font-semibold">Sales funnel · last 30 days</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="New leads" value={String(recentLeads.length)} /><Metric label="Average response" value={responseMinutes === null ? "—" : `${responseMinutes} min`} tone={responseMinutes !== null && responseMinutes <= 5 ? "text-emerald-300" : "text-yellow-300"} /><Metric label="Appointment rate" value={`${appointmentRate}%`} /><Metric label="Close rate" value={`${closeRate}%`} /></div></section>

    <section className="mt-8"><h2 className="text-lg font-semibold">Inventory economics</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Available units" value={String(available.length)} detail={`${sold.length} marked sold`} /><Metric label="Capital invested" value={money(inventoryCost)} /><Metric label="Projected gross" value={money(projectedGross)} /><Metric label="Average projected gross" value={money(averageGross)} /></div></section>

    <section className="mt-8"><h2 className="text-lg font-semibold">Operational risk</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Overdue follow-ups" value={String(overdue.length)} tone={overdue.length ? "text-yellow-300" : "text-emerald-300"} /><Metric label="Over 60 days" value={String(aging60.length)} detail={`${aging90.length} over 90 days`} tone={aging60.length ? "text-red-300" : "text-emerald-300"} /><Metric label="Marketing readiness" value={`${readiness}%`} detail={`${marketReady.length} fully ready`} tone={readiness >= 80 ? "text-emerald-300" : "text-yellow-300"} /><Metric label="Units needing quality work" value={String(available.length - marketReady.length)} tone={available.length - marketReady.length ? "text-yellow-300" : "text-emerald-300"} /></div></section>

    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><p className="text-sm font-medium text-blue-400">Owner interpretation</p><h2 className="mt-2 text-2xl font-semibold">What needs attention now</h2><div className="mt-5 space-y-3 text-sm text-slate-300">{overdue.length > 0 && <p>• Recover {overdue.length} overdue follow-up{overdue.length === 1 ? "" : "s"} before adding more lead volume.</p>}{responseMinutes !== null && responseMinutes > 5 && <p>• Response time is above the five-minute target; tighten lead routing and accountability.</p>}{aging90.length > 0 && <p>• Reprice or wholesale {aging90.length} unit{aging90.length === 1 ? "" : "s"} over 90 days.</p>}{readiness < 80 && <p>• Improve photos, pricing, color, and description data before increasing ad spend.</p>}{overdue.length === 0 && aging90.length === 0 && readiness >= 80 && <p>• Core execution indicators are healthy. Focus on increasing qualified lead volume.</p>}</div></section>
  </div></main>;
}

function Metric({ label, value, detail, tone = "" }: { label: string; value: string; detail?: string; tone?: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>{detail && <p className="mt-2 text-sm text-slate-500">{detail}</p>}</div>; }
