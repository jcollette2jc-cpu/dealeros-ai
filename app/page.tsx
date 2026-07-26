import { prisma } from "@/lib/prisma";
import { daysInStock, estimatedGross, money, totalCost } from "@/lib/vehicles";
import Link from "next/link";

export default async function Home() {
  const vehicles = await prisma.vehicle.findMany({ where: { archivedAt: null } });
  const available = vehicles.filter((vehicle) => vehicle.status === "Available");
  const aging = available.filter((vehicle) => daysInStock(vehicle.dateIn) > 90);
  const missingPrice = available.filter((vehicle) => Number(vehicle.retailPrice) === 0);
  const capital = available.reduce((sum, vehicle) => sum + totalCost(vehicle), 0);
  const lowGross = available.filter((vehicle) => estimatedGross(vehicle) < 1500 && Number(vehicle.retailPrice) > 0);

  const missions = [
    ...(aging.length ? [`Review pricing on ${aging.length} unit${aging.length === 1 ? "" : "s"} over 90 days.`] : []),
    ...(missingPrice.length ? [`Enter retail pricing for ${missingPrice.length} vehicle${missingPrice.length === 1 ? "" : "s"}.`] : []),
    ...(lowGross.length ? [`Review costs on ${lowGross.length} low-gross vehicle${lowGross.length === 1 ? "" : "s"}.`] : []),
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div><p className="text-sm font-medium text-blue-400">Reliable Auto Sales</p><h1 className="mt-2 text-3xl font-bold md:text-4xl">DealerOS AI Command Center</h1><p className="mt-2 text-slate-400">Live priorities calculated from your inventory.</p></div>
          <div className="flex gap-3"><Link href="/inventory" className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800">View Inventory</Link><Link href="/inventory/new" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">Add Vehicle</Link></div>
        </header>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active Inventory" value={String(available.length)} />
          <Metric label="Over 90 Days" value={String(aging.length)} tone="text-red-300" />
          <Metric label="Missing Prices" value={String(missingPrice.length)} tone="text-yellow-300" />
          <Metric label="Capital Invested" value={money(capital)} />
        </section>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-medium text-blue-400">Manager Rules</p>
          <h2 className="mt-2 text-2xl font-semibold">Recommended actions</h2>
          <div className="mt-6 space-y-4">
            {missions.length ? missions.map((mission, index) => <div key={mission} className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">{index + 1}</span><p>{mission}</p></div>) : <p className="text-slate-400">No urgent inventory actions right now.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p></div>; }
