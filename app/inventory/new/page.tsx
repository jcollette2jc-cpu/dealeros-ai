import { createVehicle } from "../actions";
import { VehicleForm } from "../vehicle-form";

export default function NewVehiclePage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Add Vehicle</h1>
        <p className="mt-2 text-slate-400">Enter the vehicle and investment details.</p>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <VehicleForm action={createVehicle} submitLabel="Add Vehicle" />
        </section>
      </div>
    </main>
  );
}
