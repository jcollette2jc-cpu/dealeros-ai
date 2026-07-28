import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { saveDealershipSettings } from "./actions";

export default async function SettingsPage() {
  const settings = await prisma.dealershipSettings.findUnique({ where: { id: 1 } });
  const value = (key: keyof NonNullable<typeof settings>, fallback = "") => String(settings?.[key] ?? fallback);
  const input = "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-blue-400">← DealerOS Dashboard</Link>
        <header className="mt-6 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold">Dealership Settings</h1>
          <p className="mt-2 text-slate-400">One source of truth for marketing, public inventory, contact links, and disclosures.</p>
        </header>
        <form action={saveDealershipSettings} className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Dealership name" name="name" defaultValue={value("name", "Reliable Auto Sales")} className={input} required />
            <Field label="Phone" name="phone" defaultValue={value("phone")} className={input} />
            <Field label="Email" name="email" type="email" defaultValue={value("email")} className={input} />
            <Field label="Website" name="website" defaultValue={value("website")} className={input} />
            <Field label="Street address" name="streetAddress" defaultValue={value("streetAddress", "9423 Lima Rd.")} className={input} required />
            <Field label="City" name="city" defaultValue={value("city", "Fort Wayne")} className={input} required />
            <Field label="State" name="state" defaultValue={value("state", "IN")} className={input} required />
            <Field label="ZIP code" name="postalCode" defaultValue={value("postalCode")} className={input} />
          </div>
          <label className="mt-5 block text-sm font-medium">Financing disclosure</label>
          <textarea name="financingDisclosure" rows={4} defaultValue={value("financingDisclosure", "Financing options may be available for qualified buyers.")} className={`${input} mt-2`} />
          <button className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold">Save Settings</button>
        </form>
      </div>
    </main>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return <label className="text-sm font-medium">{label}<input {...inputProps} className={`${inputProps.className} mt-2`} /></label>;
}
