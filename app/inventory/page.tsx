"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const vehicles = [
  {
    stock: "034449",
    vehicle: "2016 Volvo XC90",
    vin: "YV4A22PK1G1034449",
    mileage: 114500,
    age: 210,
    price: 14355,
    cost: 10879,
    status: "Available",
  },
  {
    stock: "D00017",
    vehicle: "2011 Ford F-150",
    vin: "1FTFX1EF3BKD00017",
    mileage: 144028,
    age: 128,
    price: 13859,
    cost: 5980,
    status: "Available",
  },
  {
    stock: "037652",
    vehicle: "2012 Toyota Sienna",
    vin: "5TDDK3DC2CS037652",
    mileage: 147668,
    age: 112,
    price: 9975,
    cost: 10541,
    status: "Available",
  },
  {
    stock: "100921r",
    vehicle: "2009 Toyota Camry",
    vin: "4T4BE46K39R100921",
    mileage: 109520,
    age: 105,
    price: 0,
    cost: 7559,
    status: "Pending",
  },
  {
    stock: "178572",
    vehicle: "2014 Chevrolet Camaro",
    vin: "2G1FC3D34E9178572",
    mileage: 96814,
    age: 103,
    price: 15650,
    cost: 7992,
    status: "Available",
  },
  {
    stock: "721231",
    vehicle: "2019 Chrysler Pacifica",
    vin: "2C4RC1BG7KR721231",
    mileage: 92344,
    age: 102,
    price: 0,
    cost: 12849,
    status: "Available",
  },
];

function money(value: number) {
  if (!value) return "Not entered";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getRecommendation(age: number, price: number) {
  if (!price) return "Enter retail price";
  if (age > 120) return "Urgent pricing review";
  if (age > 90) return "Reprice and advertise";
  if (age > 60) return "Refresh marketing";
  return "Monitor performance";
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((vehicle) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
          vehicle.vehicle.toLowerCase().includes(searchText) ||
          vehicle.vin.toLowerCase().includes(searchText) ||
          vehicle.stock.toLowerCase().includes(searchText);

        const matchesStatus =
          statusFilter === "All" || vehicle.status === statusFilter;

        const matchesAge =
          ageFilter === "All" ||
          (ageFilter === "0-60" && vehicle.age <= 60) ||
          (ageFilter === "61-90" &&
            vehicle.age >= 61 &&
            vehicle.age <= 90) ||
          (ageFilter === "91+" && vehicle.age >= 91);

        return matchesSearch && matchesStatus && matchesAge;
      })
      .sort((a, b) => b.age - a.age);
  }, [search, statusFilter, ageFilter]);

  const totalCost = filteredVehicles.reduce(
    (total, vehicle) => total + vehicle.cost,
    0,
  );

  const totalPotentialGross = filteredVehicles.reduce(
    (total, vehicle) =>
      total + Math.max(vehicle.price - vehicle.cost, 0),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 p-6 md:block">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
            DealerOS
          </p>

          <h1 className="mt-2 text-2xl font-bold">AI Command Center</h1>

          <nav className="mt-10 space-y-2">
            <Link
              href="/"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <Link
              href="/inventory"
              className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium"
            >
              Inventory
            </Link>

            {["CRM", "Marketing", "AI Employees", "Reports", "Settings"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-slate-500"
                >
                  {item}
                </div>
              ),
            )}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-6 md:p-10">
          <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400">
                Reliable Auto Sales
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Inventory Intelligence
              </h2>

              <p className="mt-2 text-slate-400">
                Identify aging units, pricing risks, and profit opportunities.
              </p>
            </div>

            <button className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">
              Import Inventory
            </button>
          </header>

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Vehicles Shown</p>
              <p className="mt-2 text-3xl font-bold">
                {filteredVehicles.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Over 90 Days</p>
              <p className="mt-2 text-3xl font-bold text-red-300">
                {
                  filteredVehicles.filter((vehicle) => vehicle.age > 90)
                    .length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Capital Invested</p>
              <p className="mt-2 text-3xl font-bold">{money(totalCost)}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Potential Gross</p>
              <p className="mt-2 text-3xl font-bold text-green-300">
                {money(totalPotentialGross)}
              </p>
            </div>
          </section>

          <section className="mb-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Search inventory
              </label>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Vehicle, stock number, or VIN"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option>All</option>
                <option>Available</option>
                <option>Pending</option>
                <option>Sold</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Inventory age
              </label>

              <select
                value={ageFilter}
                onChange={(event) => setAgeFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="All">All ages</option>
                <option value="0-60">0–60 days</option>
                <option value="61-90">61–90 days</option>
                <option value="91+">91+ days</option>
              </select>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-5">
              <h3 className="text-xl font-semibold">Vehicle Inventory</h3>
              <p className="mt-1 text-sm text-slate-400">
                Oldest inventory appears first.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Vehicle</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Mileage</th>
                    <th className="px-5 py-4">Age</th>
                    <th className="px-5 py-4">Cost</th>
                    <th className="px-5 py-4">Retail</th>
                    <th className="px-5 py-4">Est. Gross</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">AI Recommendation</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVehicles.map((vehicle) => {
                    const gross = vehicle.price
                      ? vehicle.price - vehicle.cost
                      : 0;

                    return (
                      <tr
                        key={vehicle.vin}
                        className="border-t border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">{vehicle.vehicle}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {vehicle.vin}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {vehicle.stock}
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {number(vehicle.mileage)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              vehicle.age > 120
                                ? "bg-red-500/15 text-red-300"
                                : vehicle.age > 90
                                  ? "bg-orange-500/15 text-orange-300"
                                  : vehicle.age > 60
                                    ? "bg-yellow-500/15 text-yellow-300"
                                    : "bg-green-500/15 text-green-300"
                            }`}
                          >
                            {vehicle.age} days
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {money(vehicle.cost)}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {money(vehicle.price)}
                        </td>

                        <td
                          className={`px-5 py-4 font-semibold ${
                            gross > 0 ? "text-green-300" : "text-red-300"
                          }`}
                        >
                          {vehicle.price ? money(gross) : "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {vehicle.status}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300">
                            {getRecommendation(vehicle.age, vehicle.price)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredVehicles.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  No vehicles match your search or filters.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}