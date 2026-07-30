import { prisma } from "@/lib/prisma";
import { daysInStock, estimatedGross, money } from "@/lib/vehicles";
import Link from "next/link";

export default async function InventoryQualityPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { archivedAt: null, status: { in: ["Available", "Pending"] } },
    include: { photos: true },
    orderBy: [{ dateIn: "asc" }, { year: "desc" }],
  });

  const issues = vehicles.map((vehicle) => {
    const reasons: string[] = [];
    if (Number(vehicle.retailPrice) <= 0) reasons.push("Missing retail price");
    if (!vehicle.trim?.trim()) reasons.push("Missing trim");
    if (!vehicle.color?.trim()) reasons.push("Missing color");
    if (!vehicle.notes?.trim()) reasons.push("Missing description notes");
    if (vehicle.photos.length === 0) reasons.push("No photos");
    else if (vehicle.photos.length < 12) reasons.push(`${vehicle.photos.length}/12 photos`);
    if (daysInStock(vehicle.dateIn) > 90) reasons.push("Over 90 days in stock");
    if (Number(vehicle.retailPrice) > 0 && estimatedGross(vehicle) < 1500) reasons.push("Projected gross below $1,500");
    return { vehicle, reasons };
  }).filter((item) => item.reasons.length > 0);

  const ready = vehicles.length - issues.length;
  const readiness = vehicles.length ? Math.round((ready / vehicles.length) * 100) : 100;

  return <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10"><div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between">
      <div><Link href="/inventory" className="text-sm text-blue-400">← Inventory</Link><h1 className="mt-3 text-3xl font-bold">Inventory Quality Review</h1><p className="mt-2 text-slate-400">A single exception queue for records that block merchandising, search visibility, or profit.</p></div>
      <Link href="/inventory/import" className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold">Import DealerClick CSV</Link>
    </header>

    <section className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Quality readiness" value={`${readiness}%`} /><Metric label="Ready vehicles" value={String(ready)} tone="text-emerald-300" /><Metric label="Needs review" value={String(issues.length)} tone={issues.length ? "text-yellow-300" : "text-emerald-300"} /></section>

    <section className="mt-8 space-y-4">
      {issues.map(({ vehicle, reasons }) => <article key={vehicle.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm text-blue-400">Stock #{vehicle.stockNumber}</p><h2 className="mt-1 text-xl font-semibold">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}</h2><p className="mt-2 text-sm text-slate-400">{daysInStock(vehicle.dateIn)} days · {vehicle.photos.length} photos · {money(Number(vehicle.retailPrice))} retail · {money(estimatedGross(vehicle))} projected gross</p><div className="mt-4 flex flex-wrap gap-2">{reasons.map((reason) => <span key={reason} className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">{reason}</span>)}</div></div><div className="flex gap-3"><Link href={`/inventory/${vehicle.id}`} className="rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold">Review</Link><Link href={`/inventory/${vehicle.id}/edit`} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold">Fix Record</Link></div></div></article>)}
      {issues.length === 0 && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-12 text-center text-emerald-200">Every active vehicle passes the current quality rules.</div>}
    </section>
  </div></main>;
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p></div>; }
