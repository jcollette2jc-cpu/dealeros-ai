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
  const [vehicles, storedSettings] = await Promise.all([
    prisma.vehicle.findMany({
      where: { archivedAt: null, status: "Available", retailPrice: { gt: 0 } },
      include: { photos: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] } },
      orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
    }),
    prisma.dealershipSettings.findUnique({ where: { id: 1 } }),
  ]);

  const settings = {
    name: storedSettings?.name ?? "Reliable Auto Sales",
    phone: storedSettings?.phone ?? null,
    email: storedSettings?.email ?? null,
    website: storedSettings?.website ?? null,
    streetAddress: storedSettings?.streetAddress ?? "9423 Lima Rd.",
    city: storedSettings?.city ?? "Fort Wayne",
    state: storedSettings?.state ?? "IN",
    postalCode: storedSettings?.postalCode ?? null,
    financingDisclosure: storedSettings?.financingDisclosure ?? "Financing options may be available for qualified buyers.",
  };
  const addressLine = [settings.streetAddress, settings.city, settings.state, settings.postalCode].filter(Boolean).join(", ");
  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/[^+\d]/g, "")}` : null;

  const inventorySchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${settings.name} Available Inventory`,
    numberOfItems: vehicles.length,
    itemListElement: vehicles.map((vehicle, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Vehicle",
        name: [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" "),
        vehicleIdentificationNumber: vehicle.vin,
        mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "SMI" },
        color: vehicle.color || undefined,
        image: vehicle.photos.map((photo) => photo.url),
        description: generateVehicleMarketing(vehicle).website,
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: Number(vehicle.retailPrice),
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "AutoDealer",
            name: settings.name,
            telephone: settings.phone || undefined,
            email: settings.email || undefined,
            url: settings.website || undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: settings.streetAddress,
              addressLocality: settings.city,
              addressRegion: settings.state,
              postalCode: settings.postalCode || undefined,
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
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">{settings.name}</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Available used vehicles</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Browse current cars, trucks, and SUVs. Inventory and pricing update directly from DealerOS AI.</p>
          <p className="mt-2 text-sm text-slate-500">{addressLine}</p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-2xl font-semibold">{vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} available</h2><p className="mt-1 text-sm text-slate-400">{settings.financingDisclosure}</p></div>
          {phoneHref && <a href={phoneHref} className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold hover:bg-blue-500">Call {settings.name}</a>}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => {
            const marketing = generateVehicleMarketing(vehicle);
            const primaryPhoto = vehicle.photos.find((photo) => photo.isPrimary) ?? vehicle.photos[0];
            return (
              <article key={vehicle.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
                {primaryPhoto ? (
                  <img src={primaryPhoto.url} alt={primaryPhoto.altText ?? `${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex min-h-44 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-8 text-center">
                    <div><p className="text-sm uppercase tracking-widest text-blue-400">Stock #{vehicle.stockNumber}</p><p className="mt-3 text-3xl font-bold">{vehicle.year} {vehicle.make}</p><p className="mt-1 text-xl text-slate-300">{vehicle.model} {vehicle.trim}</p></div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-400">{vehicle.mileage.toLocaleString("en-US")} miles</p><p className="mt-1 text-sm text-slate-500">{vehicle.color || "Color available on request"}</p></div><p className="text-2xl font-bold text-emerald-300">{money(Number(vehicle.retailPrice))}</p></div>
                  <p className="mt-5 line-clamp-4 text-sm leading-6 text-slate-300">{marketing.website}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {phoneHref && <a href={phoneHref} className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold hover:bg-blue-500">Call</a>}
                    {settings.email && <a href={`mailto:${settings.email}?subject=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model} Stock ${vehicle.stockNumber}`)}&body=${encodeURIComponent(marketing.text)}`} className="rounded-lg border border-slate-700 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-800">Ask About It</a>}
                  </div>
                  {!phoneHref && !settings.email && <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-slate-200">Ask for Stock #{vehicle.stockNumber} at {settings.streetAddress}</div>}
                </div>
              </article>
            );
          })}
        </div>

        {vehicles.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">Inventory is being updated. Visit {settings.name} for current availability.</div>}
      </section>
    </main>
  );
}