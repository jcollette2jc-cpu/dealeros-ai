"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { autoMapHeaders, mapRow, parseCsv, VEHICLE_FIELDS, type ColumnMapping, type CsvRow } from "@/lib/imports/vehicle-csv";
import { importVehicles, type ImportResult } from "./actions";

const labels: Record<string, string> = {
  stockNumber: "Stock number", vin: "VIN / serial", year: "Year", make: "Make", model: "Model",
  trim: "Trim", mileage: "Mileage", dateIn: "Date acquired", retailPrice: "Retail price",
  vehicleCost: "Vehicle cost", reconCost: "Recon cost", otherCost: "Other cost",
  color: "Color", status: "Inventory status", notes: "Vehicle notes", photoUrl: "Primary photo URL",
  customerFirstName: "Customer first name", customerLastName: "Customer last name",
  customerPhone: "Customer phone", customerEmail: "Customer email", leadSource: "Lead source",
  leadStatus: "Lead status", leadPriority: "Lead priority",
};

export default function InventoryImportPage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const mappedRows = useMemo(() => rows.map((row) => mapRow(row, mapping)), [rows, mapping]);
  const required = ["stockNumber", "vin", "year", "make", "model"];
  const previewFields = [...required, "photoUrl", "customerFirstName", "customerPhone"];
  const ready = required.every((field) => Object.values(mapping).includes(field as never));

  async function chooseFile(file?: File) {
    if (!file) return;
    setResult(null);
    if (file.size > 5_000_000) {
      setResult({ created: 0, updated: 0, photos: 0, leads: 0, skipped: 0, errors: [{ row: 0, message: "Choose a CSV smaller than 5 MB." }] });
      return;
    }
    const parsed = parseCsv(await file.text());
    const saved = localStorage.getItem("dealeros_dealerclick_mapping");
    const auto = autoMapHeaders(parsed.headers);
    const previous = saved ? JSON.parse(saved) as ColumnMapping : {};
    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(Object.fromEntries(parsed.headers.map((header) => [header, previous[header] ?? auto[header] ?? "ignore"])));
  }

  async function commitImport() {
    if (!ready || busy) return;
    setBusy(true);
    localStorage.setItem("dealeros_dealerclick_mapping", JSON.stringify(mapping));
    try { setResult(await importVehicles(mappedRows)); } finally { setBusy(false); }
  }

  const input = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm";
  return <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10"><div className="mx-auto max-w-6xl">
    <Link href="/inventory" className="text-sm text-blue-400">← Inventory</Link>
    <h1 className="mt-4 text-3xl font-bold">Import DealerClick Inventory</h1>
    <p className="mt-2 text-slate-400">Preview vehicle, photo, and optional customer data before DealerOS changes anything.</p>

    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-700 p-8 text-center hover:border-blue-500"><span className="font-semibold">{fileName || "Choose DealerClick CSV"}</span><span className="mt-2 block text-sm text-slate-400">Nothing imports until you approve the preview.</span><input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} /></label></section>

    {headers.length > 0 && <><section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Match DealerClick columns</h2><p className="mt-1 text-sm text-slate-400">DealerOS remembers this mapping. Photo and customer fields are optional.</p><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{headers.map((header) => <label key={header} className="text-sm text-slate-300"><span className="mb-2 block truncate">{header}</span><select className={input} value={mapping[header] ?? "ignore"} onChange={(event) => setMapping({ ...mapping, [header]: event.target.value as ColumnMapping[string] })}><option value="ignore">Ignore column</option>{VEHICLE_FIELDS.map((field) => <option key={field} value={field}>{labels[field]}</option>)}</select></label>)}</div>{!ready && <p className="mt-5 text-sm text-yellow-300">Map Stock number, VIN / serial, Year, Make, and Model to continue.</p>}</section>

    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"><div className="flex items-center justify-between p-5"><div><h2 className="text-xl font-semibold">Preview</h2><p className="text-sm text-slate-400">{rows.length} rows found · first 10 shown</p></div><button disabled={!ready || busy} onClick={commitImport} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold disabled:opacity-40">{busy ? "Importing…" : "Approve Import"}</button></div><div className="overflow-x-auto"><table className="w-full min-w-[1200px] text-left text-sm"><thead className="bg-slate-950 text-slate-400"><tr>{previewFields.map((field) => <th className="px-4 py-3" key={field}>{labels[field]}</th>)}</tr></thead><tbody>{mappedRows.slice(0, 10).map((row, index) => <tr className="border-t border-slate-800" key={index}>{previewFields.map((field) => <td className="max-w-48 truncate px-4 py-3" key={field}>{row[field as keyof typeof row] || "—"}</td>)}</tr>)}</tbody></table></div></section></>}

    {result && <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Import result</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Summary label="Created" value={result.created} /><Summary label="Updated" value={result.updated} /><Summary label="Photos" value={result.photos} /><Summary label="Leads" value={result.leads} /><Summary label="Skipped" value={result.skipped} /></div>{result.errors.length > 0 && <div className="mt-5 max-h-64 overflow-auto rounded-lg bg-red-500/10 p-4 text-sm text-red-200">{result.errors.map((error, index) => <p key={index}>{error.message}</p>)}</div>}{!result.errors.length && <div className="mt-5 flex gap-5"><Link href="/inventory" className="text-blue-400">View inventory →</Link><Link href="/crm" className="text-blue-400">View imported leads →</Link></div>}</section>}
  </div></main>;
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-slate-950 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
