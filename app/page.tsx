const priorities = [
  {
    title: "Hot Leads",
    value: "5",
    description: "Customers showing strong buying intent",
  },
  {
    title: "Inventory Alerts",
    value: "3",
    description: "Vehicles needing pricing or marketing attention",
  },
  {
    title: "Appointments",
    value: "2",
    description: "Scheduled customer visits today",
  },
  {
    title: "Follow-Ups",
    value: "6",
    description: "Customers waiting for a response",
  },
];

const missions = [
  "Call John Smith before 10:00 AM.",
  "Lower the 2020 Silverado price by $500.",
  "Post the 2022 Explorer to Facebook Marketplace.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 p-6 md:block">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
              DealerOS
            </p>
            <h1 className="mt-2 text-2xl font-bold">AI Command Center</h1>
          </div>

          <nav className="space-y-2">
            {[
              "Dashboard",
              "Inventory",
              "CRM",
              "Marketing",
              "AI Employees",
              "Reports",
              "Settings",
            ].map((item, index) => (
              <button
                key={item}
                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                  index === 0
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 p-6 md:p-10">
          <header className="mb-10 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400">
                Reliable Auto Sales
              </p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                Good evening, Jim
              </h2>
              <p className="mt-2 text-slate-400">
                Here is what deserves your attention today.
              </p>
            </div>

            <button className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">
              Add Vehicle
            </button>
          </header>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Today&apos;s Mission</h3>
              <span className="text-sm text-slate-400">Live dealership view</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {priorities.map((priority) => (
                <article
                  key={priority.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
                >
                  <p className="text-sm font-medium text-slate-400">
                    {priority.title}
                  </p>
                  <p className="mt-3 text-4xl font-bold">{priority.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {priority.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm font-medium text-blue-400">Manager AI</p>
              <h3 className="mt-2 text-2xl font-semibold">
                Recommended actions
              </h3>

              <div className="mt-6 space-y-4">
                {missions.map((mission, index) => (
                  <div
                    key={mission}
                    className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-slate-200">{mission}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm font-medium text-blue-400">
                Today&apos;s Sales Goal
              </p>
              <p className="mt-4 text-5xl font-bold">2</p>
              <p className="mt-2 text-slate-400">vehicles sold</p>

              <div className="mt-8 border-t border-slate-800 pt-6">
                <p className="text-sm text-slate-400">Expected gross profit</p>
                <p className="mt-2 text-3xl font-bold">$8,700</p>
              </div>

              <button className="mt-8 w-full rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800">
                View Sales Report
              </button>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}