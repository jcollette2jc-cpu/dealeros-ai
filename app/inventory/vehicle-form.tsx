"use client";

import { VEHICLE_STATUSES } from "@/lib/vehicles";
import Link from "next/link";
import { useActionState } from "react";
import type { VehicleFormState } from "./actions";

type VehicleDefaults = Record<string, string | number | null | undefined>;

export function VehicleForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref = "/inventory",
}: {
  action: (
    state: VehicleFormState,
    formData: FormData,
  ) => Promise<VehicleFormState>;
  defaults?: VehicleDefaults;
  submitLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const value = (name: string) => state.fields?.[name] ?? defaults[name] ?? "";
  const input =
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500";

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div role="alert" className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-200">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Stock number" name="stockNumber" defaultValue={value("stockNumber")} required className={input} />
        <Field label="VIN" name="vin" defaultValue={value("vin")} required maxLength={17} className={input} />
        <Field label="Year" name="year" type="number" defaultValue={value("year")} required min={1900} max={new Date().getFullYear() + 1} className={input} />
        <Field label="Make" name="make" defaultValue={value("make")} required className={input} />
        <Field label="Model" name="model" defaultValue={value("model")} required className={input} />
        <Field label="Trim" name="trim" defaultValue={value("trim")} className={input} />
        <Field label="Mileage" name="mileage" type="number" defaultValue={value("mileage")} min={0} className={input} />
        <Field label="Date acquired" name="dateIn" type="date" defaultValue={value("dateIn")} className={input} />
        <Field label="Color" name="color" defaultValue={value("color")} className={input} />

        <label className="space-y-2 text-sm font-medium text-slate-300">
          <span>Status</span>
          <select name="status" defaultValue={String(value("status") || "Available")} className={input}>
            {VEHICLE_STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>

        <Field label="Retail price" name="retailPrice" type="number" step="0.01" defaultValue={value("retailPrice")} min={0} className={input} />
        <Field label="Vehicle cost" name="vehicleCost" type="number" step="0.01" defaultValue={value("vehicleCost")} min={0} className={input} />
        <Field label="Recon cost" name="reconCost" type="number" step="0.01" defaultValue={value("reconCost")} min={0} className={input} />
        <Field label="Other cost" name="otherCost" type="number" step="0.01" defaultValue={value("otherCost")} min={0} className={input} />
      </div>

      <label className="block space-y-2 text-sm font-medium text-slate-300">
        <span>Notes</span>
        <textarea name="notes" defaultValue={String(value("notes"))} rows={4} className={input} />
      </label>

      <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-6">
        <button disabled={pending} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold hover:bg-slate-800">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="space-y-2 text-sm font-medium text-slate-300">
      <span>{label}</span>
      <input {...inputProps} />
    </label>
  );
}
