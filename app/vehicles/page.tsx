import { generateVehicleMarketing } from "@/lib/marketing";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/vehicles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Used Cars, Trucks and SUVs | Reliable Auto Sales",
  description: "Browse available used cars, trucks and SUVs at Reliable Auto Sales in Fort Wayne, Indiana.",
};

export const revalidate = 300;

export default async function PublicInventoryPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { archivedAt: null, status: "Available", retailPrice: { gt: 0 } },
    orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
  });

  const inventorySchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Reliable Auto Sales Available Inventory",
    numberOfItems: vehicles.length,
    itemListElement: vehicles.map((vehicle, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Vehicle",
        name: [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" "),
        vehicleIdentificationNumber: vehicle.vin,
        mileageFromOdometer: {
          "@type": "QuantitativeValue",
          value: vehicle.mileage,
          unitCode: "SMI",
        },
        color: vehicle.color || undefined,
        description: generateVehicleMarketing(vehicle).website,
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: Number(vehicle.retailPrice),
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "AutoDealer",
            name: "Reliable Auto Sales",
            address: {
              "@type": "PostalAddress",
              streetAddress: "9423 Lima Rd.",
              addressLocality: "Fort Wayne",
              addressRegion: "IN",
              addressCountry: "US",
            },
          },
        },
      },
    })),
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(inventorySchema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Reliable Auto Sales</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Available used vehicles</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Browse current cars, trucks, and SUVs. Inventory and pricing update directly from DealerOS AI.</p>
          <p className="mt-2 text-sm text-slate-500">9423 Lima Rd., Fort Wayne, Indiana</p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><h2 className="text-2xl font-semibold">{vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} available</h2><p className="mt-1 text-sm text-slate-400">Contact the dealership to confirm availability and financing terms.</p></div>
          <a href="tel:+1" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">Call Reliable Auto Sales</a>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => {
            const marketing = generateVehicleMarketing(vehicle);
            return (
              <article key={vehicle.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
                <div className="flex min-h-44 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-8 text-center">
                  <div><p className="text-sm uppercase tracking-widest text-blue-400">Stock #{vehicle.stockNumber}</p><p className="mt-3 text-3xl font-bold">{vehicle.year} {vehicle.make}</p><p className="mt-1 text-xl text-slate-300">{vehicle.model} {vehicle.trim}</p></div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-400">{vehicle.mileage.toLocaleString("en-US")} miles</p><p className="mt-1 text-sm text-slate-500">{vehicle.color || "Color available on request"}</p></div><p className="text-2xl font-bold text-emerald-300">{money(Number(vehicle.retailPrice))}</p></div>
                  <p className="mt-5 line-clamp-4 text-sm leading-6 text-slate-300">{marketing.website}</p>
                  <div className="mt-6 grid grid-cols-2 gap-3"><a href="tel:+1" className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold hover:bg-blue-500">Call</a><a href={`mailto:?subject=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}&body=${encodeURIComponent(marketing.text)}`} className="rounded-lg border border-slate-700 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-800">Ask About It</a></div>
                </div>
              </article>
            );
          })}
        </div>

        {vehicles.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">Inventory is being updated. Contact Reliable Auto Sales for current availability.</div>}
      </section>
    </main>
  );
}
