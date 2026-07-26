import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateVehicle } from "../../actions";
import { VehicleForm } from "../../vehicle-form";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id: Number(id), archivedAt: null } });
  if (!vehicle) notFound();
  const action = updateVehicle.bind(null, vehicle.id);
  const defaults = {
    stockNumber: vehicle.stockNumber,
    vin: vehicle.vin,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    mileage: vehicle.mileage,
    color: vehicle.color,
    status: vehicle.status,
    notes: vehicle.notes,
    retailPrice: Number(vehicle.retailPrice),
    vehicleCost: Number(vehicle.vehicleCost),
    reconCost: Number(vehicle.reconCost),
    otherCost: Number(vehicle.otherCost),
    dateIn: vehicle.dateIn?.toISOString().slice(0, 10),
  };
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Edit Vehicle</h1>
        <p className="mt-2 text-slate-400">{vehicle.year} {vehicle.make} {vehicle.model} · Stock #{vehicle.stockNumber}</p>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <VehicleForm action={action} defaults={defaults} submitLabel="Save Changes" cancelHref={`/inventory/${vehicle.id}`} />
        </section>
      </div>
    </main>
  );
}
