import { prisma } from "@/lib/prisma";
import {
  daysInStock,
  estimatedGross,
  money,
  recommendation,
  totalCost,
} from "@/lib/vehicles";
import Link from "next/link";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  age?: string;
  success?: string;
}>;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const vehicles = await prisma.vehicle.findMany({
    where: {
      archivedAt: null,
      ...(params.status && params.status !== "All"
        ? { status: params.status }
        : {}),
      ...(params.q
        ? {
            OR: [
              { stockNumber: { contains: params.q } },
              { vin: { contains: params.q } },
              { make: { contains: params.q } },
              { model: { contains: params.q } },
            ],
          }
        : {}),
    },
    orderBy: [{ dateIn: "asc" }, { createdAt: "asc" }],
  });

  const withMetrics = vehicles
    .map((vehicle) => ({
      vehicle,
      age: daysInStock(vehicle.dateIn),
      cost: totalCost(vehicle),
      gross: estimatedGross(vehicle),
    }))
    .filter(({ age }) => {
      if (params.age === "0-60") return age <= 60;
      if (params.age === "61-90") return age >= 61 && age <= 90;
      if (params.age === "91+") return age >= 91;
      return true;
    });

  const capital = withMetrics.reduce((sum, row) => sum + row.cost, 0);
  const gross = withMetrics.reduce(
    (sum, row) => sum + Math.max(row.gross, 0),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-blue-400 hover:text-blue-300">
              ← DealerOS Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold">Inventory Intelligence</h1>
            <p className="mt-2 text-slate-400">
              Live vehicle data from the DealerOS database.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/inventory/import" className="rounded-lg border border-slate-700 px-5 py-3 text-center text-sm font-semibold hover:bg-slate-800">
              Import DealerClick CSV
            </Link>
            <Link href="/inventory/new" className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold hover:bg-blue-500">
              Add Vehicle
            </Link>
          </div>
        </header>

        {params.success && (
          <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-green-200">
            Vehicle {params.success === "created" ? "added" : "archived"} successfully.
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Vehicles Shown" value={String(withMetrics.length)} />
          <Metric label="Over 90 Days" value={String(withMetrics.filter((row) => row.age > 90).length)} tone="text-red-300" />
          <Metric label="Capital Invested" value={money(capital)} />
          <Metric label="Potential Gross" value={money(gross)} tone="text-green-300" />
        </section>

        <form className="mb-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input name="q" defaultValue={params.q} placeholder="Vehicle, stock number, or VIN" className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500" />
          <select name="status" defaultValue={params.status ?? "All"} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            {["All", "Available", "Pending", "Sold", "Wholesale"].map((status) => <option key={status}>{status}</option>)}
          </select>
          <select name="age" defaultValue={params.age ?? "All"} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            <option value="All">All ages</option>
            <option value="0-60">0–60 days</option>
            <option value="61-90">61–90 days</option>
            <option value="91+">91+ days</option>
          </select>
          <button className="rounded-lg bg-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-600">Filter</button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left">
              <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {["Vehicle", "Stock", "Mileage", "Age", "Total Cost", "Retail", "Est. Gross", "Status", "Recommendation"].map((heading) => (
                    <th key={heading} className="px-5 py-4">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withMetrics.map(({ vehicle, age, cost, gross: vehicleGross }) => (
                  <tr key={vehicle.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="px-5 py-4">
                      <Link href={`/inventory/${vehicle.id}`} className="font-semibold text-blue-300 hover:text-blue-200">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{vehicle.vin}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{vehicle.stockNumber}</td>
                    <td className="px-5 py-4 text-slate-300">{vehicle.mileage.toLocaleString()}</td>
                    <td className="px-5 py-4"><AgeBadge age={age} /></td>
                    <td className="px-5 py-4 text-slate-300">{money(cost)}</td>
                    <td className="px-5 py-4 font-semibold">{money(Number(vehicle.retailPrice))}</td>
                    <td className={`px-5 py-4 font-semibold ${vehicleGross >= 0 ? "text-green-300" : "text-red-300"}`}>{money(vehicleGross)}</td>
                    <td className="px-5 py-4 text-slate-300">{vehicle.status}</td>
                    <td className="px-5 py-4 text-sm text-blue-300">{recommendation(age, Number(vehicle.retailPrice))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {withMetrics.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                No vehicles match these filters. <Link href="/inventory/new" className="text-blue-400">Add the first vehicle.</Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p></div>;
}

function AgeBadge({ age }: { age: number }) {
  const tone = age > 120 ? "bg-red-500/15 text-red-300" : age > 90 ? "bg-orange-500/15 text-orange-300" : age > 60 ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{age} days</span>;
}
