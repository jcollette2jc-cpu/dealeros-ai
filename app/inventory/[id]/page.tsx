import { prisma } from "@/lib/prisma";
import { generateVehicleMarketing, marketingReadiness } from "@/lib/marketing";
import { daysInStock, estimatedGross, money, totalCost, VEHICLE_STATUSES } from "@/lib/vehicles";
import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveVehicle, changeVehicleStatus } from "../actions";
import { MarketingCopyCard } from "./marketing-copy-card";

export default async function VehiclePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: Number(id), archivedAt: null },
    include: { marketingApprovals: true },
  });
  if (!vehicle) notFound();

  const age = daysInStock(vehicle.dateIn);
  const cost = totalCost(vehicle);
  const gross = estimatedGross(vehicle);
  const marketing = generateVehicleMarketing(vehicle);
  const readiness = marketingReadiness(vehicle);
  const approvalByChannel = Object.fromEntries(
    vehicle.marketingApprovals.map((approval) => [approval.channel, approval.status]),
  );
  const approvedCount = vehicle.marketingApprovals.filter((approval) => approval.status === "Approved").length;
  const statusAction = changeVehicleStatus.bind(null, vehicle.id);
  const archiveAction = archiveVehicle.bind(null, vehicle.id);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/inventory" className="text-sm text-blue-400">← Inventory</Link>
        {query.success && <div className="mt-6 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-green-200">Vehicle updated successfully.</div>}
        <header className="mt-6 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div><p className="text-sm text-blue-400">Stock #{vehicle.stockNumber}</p><h1 className="mt-2 text-3xl font-bold">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}</h1><p className="mt-2 text-slate-400">{vehicle.vin}</p></div>
          <Link href={`/inventory/${vehicle.id}/edit`} className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold">Edit Vehicle</Link>
        </header>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card label="Days in Stock" value={String(age)} />
          <Card label="Total Cost" value={money(cost)} />
          <Card label="Retail Price" value={money(Number(vehicle.retailPrice))} />
          <Card label="Estimated Gross" value={money(gross)} />
          <Card label="Marketing Ready" value={`${readiness.score}%`} />
          <Card label="Assets Approved" value={`${approvedCount}/4`} />
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Vehicle Details</h2>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <Detail label="Mileage" value={vehicle.mileage.toLocaleString()} />
              <Detail label="Color" value={vehicle.color ?? "Not entered"} />
              <Detail label="Date acquired" value={vehicle.dateIn?.toLocaleDateString() ?? "Not entered"} />
              <Detail label="Vehicle cost" value={money(Number(vehicle.vehicleCost))} />
              <Detail label="Recon cost" value={money(Number(vehicle.reconCost))} />
              <Detail label="Other cost" value={money(Number(vehicle.otherCost))} />
            </dl>
            {vehicle.notes && <p className="mt-6 border-t border-slate-800 pt-5 text-sm text-slate-300">{vehicle.notes}</p>}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Actions</h2>
            <form action={statusAction} className="mt-5 flex gap-3">
              <select name="status" defaultValue={vehicle.status} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3">
                {VEHICLE_STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
              <button className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold">Update Status</button>
            </form>
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold">Marketing readiness: {readiness.score}%</p>
              {readiness.ready ? <p className="mt-2 text-sm text-green-300">Ready for automated marketing.</p> : <p className="mt-2 text-sm text-yellow-300">Add {readiness.missing.join(", ")} to improve the generated ads.</p>}
            </div>
            <div className="mt-8 border-t border-slate-800 pt-6">
              <h3 className="font-semibold text-red-300">Archive vehicle</h3>
              <p className="mt-2 text-sm text-slate-400">Removes it from active inventory without destroying its history.</p>
              <form action={archiveAction} className="mt-4">
                <button className="rounded-lg border border-red-500/50 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10">Archive Vehicle</button>
              </form>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-medium text-blue-400">Inventory Intelligence</p>
          <h2 className="mt-2 text-2xl font-semibold">Generated marketing content</h2>
          <p className="mt-2 text-sm text-slate-400">Copy, review, and approve each asset before publishing. Approvals are saved to the dealership database.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <MarketingCopyCard vehicleId={vehicle.id} channel="marketplace" title="Facebook Marketplace" content={marketing.marketplace} initialStatus={approvalByChannel.marketplace ?? "Draft"} />
            <MarketingCopyCard vehicleId={vehicle.id} channel="social" title="Facebook / Instagram" content={marketing.social} initialStatus={approvalByChannel.social ?? "Draft"} />
            <MarketingCopyCard vehicleId={vehicle.id} channel="website" title="Website Description" content={marketing.website} initialStatus={approvalByChannel.website ?? "Draft"} />
            <MarketingCopyCard vehicleId={vehicle.id} channel="text" title="Customer Text Message" content={marketing.text} initialStatus={approvalByChannel.text ?? "Draft"} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }