import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addVehiclePhoto, deleteVehiclePhoto, setPrimaryPhoto } from "./actions";

export default async function VehiclePhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: Number(id), archivedAt: null },
    include: { photos: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] } },
  });
  if (!vehicle) notFound();
  const addAction = addVehiclePhoto.bind(null, vehicle.id);
  const photoCount = vehicle.photos.length;
  const readiness = photoCount >= 12 ? "Ready" : photoCount >= 6 ? "Needs more photos" : "Not ready";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link href={`/inventory/${vehicle.id}`} className="text-sm text-blue-400">← Vehicle Details</Link>
        <header className="mt-6 border-b border-slate-800 pb-6">
          <p className="text-sm text-blue-400">Stock #{vehicle.stockNumber}</p>
          <h1 className="mt-2 text-3xl font-bold">Vehicle Photos</h1>
          <p className="mt-2 text-slate-400">{vehicle.year} {vehicle.make} {vehicle.model} · {photoCount} photos · {readiness}</p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <form action={addAction} className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Add photo</h2>
            <p className="mt-2 text-sm text-slate-400">Paste an image URL from your website, DealerClick export, or approved image host.</p>
            <input name="url" required placeholder="https://.../vehicle-photo.jpg" className="mt-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm" />
            <input name="altText" placeholder="Front three-quarter view" className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm" />
            <button className="mt-4 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold">Add Photo</button>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
              <p className="font-semibold">Photo readiness</p>
              <p className={`mt-2 ${photoCount >= 12 ? "text-green-300" : "text-yellow-300"}`}>{photoCount}/12 recommended photos</p>
            </div>
          </form>

          <div className="grid gap-5 sm:grid-cols-2">
            {vehicle.photos.map((photo) => (
              <article key={photo.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <img src={photo.url} alt={photo.altText ?? `${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="aspect-[4/3] w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-300">{photo.altText ?? "Vehicle photo"}</p>
                    {photo.isPrimary && <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">Primary</span>}
                  </div>
                  <div className="mt-4 flex gap-3">
                    {!photo.isPrimary && <form action={setPrimaryPhoto.bind(null, vehicle.id, photo.id)}><button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold">Make Primary</button></form>}
                    <form action={deleteVehiclePhoto.bind(null, vehicle.id, photo.id)}><button className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300">Delete</button></form>
                  </div>
                </div>
              </article>
            ))}
            {photoCount === 0 && <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400 sm:col-span-2">No photos yet. Add the first photo to improve listing readiness.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
