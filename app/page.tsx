import { prisma } from "@/lib/prisma";
import { daysInStock, estimatedGross, money, totalCost } from "@/lib/vehicles";
import Link from "next/link";

export default async function Home() {
  const vehicles = await prisma.vehicle.findMany({ where: { archivedAt: null } });
  const available = vehicles.filter((vehicle) => vehicle.status === "Available");
  const pending = vehicles.filter((vehicle) => vehicle.status === "Pending");
  const aging60 = available.filter((vehicle) => daysInStock(vehicle.dateIn) > 60);
  const aging90 = available.filter((vehicle) => daysInStock(vehicle.dateIn) > 90);
  const missingPrice = available.filter((vehicle) => Number(vehicle.retailPrice) === 0);
  const missingMarketing = available.filter(
    (vehicle) => !vehicle.color?.trim() || !vehicle.notes?.trim() || !vehicle.trim?.trim(),
  );
  const capital = available.reduce((sum, vehicle) => sum + totalCost(vehicle), 0);
  const retailValue = available.reduce(
    (sum, vehicle) => sum + Number(vehicle.retailPrice),
    0,
  );
  const projectedGross = available.reduce(
    (sum, vehicle) => sum + Math.max(0, estimatedGross(vehicle)),
    0,
  );
  const lowGross = available.filter(
    (vehicle) =>
      estimatedGross(vehicle) < 1500 && Number(vehicle.retailPrice) > 0,
  );
  const marketReady = available.filter(
    (vehicle) =>
      Number(vehicle.retailPrice) > 0 &&
      Boolean(vehicle.color?.trim()) &&
      Boolean(vehicle.notes?.trim()),
  );
  const readinessRate = available.length
    ? Math.round((marketReady.length / available.length) * 100)
    : 100;

  const missions = [
    ...(aging90.length
      ? [
          `Review pricing on ${aging90.length} unit${aging90.length === 1 ? "" : "s"} over 90 days.`,
        ]
      : []),
    ...(missingPrice.length
      ? [
          `Enter retail pricing for ${missingPrice.length} vehicle${missingPrice.length === 1 ? "" : "s"}.`,
        ]
      : []),
    ...(missingMarketing.length
      ? [
          `Complete marketing details for ${missingMarketing.length} vehicle${missingMarketing.length === 1 ? "" : "s"}.`,
        ]
      : []),
    ...(lowGross.length
      ? [
          `Review costs on ${lowGross.length} low-gross vehicle${lowGross.length === 1 ? "" : "s"}.`,
        ]
      : []),
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">Reliable Auto Sales</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">DealerOS AI Command Center</h1>
            <p className="mt-2 text-slate-400">Live priorities calculated from inventory, cost, aging, and marketing readiness.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/inventory" className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800">View Inventory</Link>
            <Link href="/inventory/import" className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800">Import DealerClick CSV</Link>
            <Link href="/inventory/new" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">Add Vehicle</Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active Inventory" value={String(available.length)} detail={`${pending.length} pending`} />
          <Metric label="Over 60 Days" value={String(aging60.length)} detail={`${aging90.length} over 90 days`} tone="text-red-300" />
          <Metric label="Marketing Ready" value={`${readinessRate}%`} detail={`${marketReady.length} of ${available.length} vehicles`} tone={readinessRate < 80 ? "text-yellow-300" : "text-emerald-300"} />
          <Metric label="Capital Invested" value={money(capital)} detail={`${money(retailValue)} retail value`} />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Projected Gross" value={money(projectedGross)} detail="Based on current retail prices" />
          <Metric label="Missing Prices" value={String(missingPrice.length)} detail="Cannot be marketed effectively" tone="text-yellow-300" />
          <Metric label="Incomplete Marketing" value={String(missingMarketing.length)} detail="Missing trim, color, or notes" tone="text-yellow-300" />
          <Metric label="Low-Gross Units" value={String(lowGross.length)} detail="Estimated gross below $1,500" tone="text-red-300" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-medium text-blue-400">Manager Rules</p>
            <h2 className="mt-2 text-2xl font-semibold">Recommended actions</h2>
            <div className="mt-6 space-y-4">
              {missions.length ? missions.map((mission, index) => (
                <div key={mission} className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">{index + 1}</span>
                  <p>{mission}</p>
                </div>
              )) : <p className="text-slate-400">No urgent inventory actions right now.</p>}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-medium text-blue-400">Inventory Intelligence</p>
            <h2 className="mt-2 text-2xl font-semibold">Marketing readiness</h2>
            <p className="mt-4 text-5xl font-bold">{readinessRate}%</p>
            <p className="mt-2 text-slate-400">of available inventory is ready for automated marketing.</p>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${readinessRate}%` }} />
            </div>
            <Link href="/inventory" className="mt-8 block rounded-lg border border-slate-700 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-800">Fix inventory gaps</Link>
          </article>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, detail, tone = "" }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
