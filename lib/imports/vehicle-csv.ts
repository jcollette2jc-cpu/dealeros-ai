export const VEHICLE_FIELDS = [
  "stockNumber", "vin", "year", "make", "model", "trim", "mileage",
  "dateIn", "retailPrice", "vehicleCost", "reconCost", "otherCost",
  "color", "status", "notes",
] as const;

export type VehicleField = (typeof VEHICLE_FIELDS)[number];
export type ColumnMapping = Record<string, VehicleField | "ignore">;
export type CsvRow = Record<string, string>;

const aliases: Record<VehicleField, string[]> = {
  stockNumber: ["stock", "stocknumber", "stockno", "stock#"],
  vin: ["vin", "vehicleidentificationnumber"],
  year: ["year", "yr"],
  make: ["make", "manufacturer"],
  model: ["model"],
  trim: ["trim", "series"],
  mileage: ["mileage", "miles", "odometer"],
  dateIn: ["datein", "dateacquired", "acquireddate", "inventorydate"],
  retailPrice: ["retailprice", "price", "askingprice", "listprice"],
  vehicleCost: ["vehiclecost", "cost", "purchaseprice"],
  reconCost: ["reconcost", "reconditioning", "reconditioningcost"],
  otherCost: ["othercost", "additionalcost"],
  color: ["color", "exteriorcolor", "extcolor"],
  status: ["status", "inventorystatus"],
  notes: ["notes", "comments", "description"],
};

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9#]/g, "");
}

export function autoMapHeaders(headers: string[]): ColumnMapping {
  return Object.fromEntries(headers.map((header) => {
    const key = normalized(header);
    const match = VEHICLE_FIELDS.find((field) => aliases[field].includes(key));
    return [header, match ?? "ignore"];
  }));
}

export function parseCsv(input: string): { headers: string[]; rows: CsvRow[] } {
  const matrix: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value.trim()); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim()); value = "";
      if (row.some(Boolean)) matrix.push(row);
      row = [];
    } else value += char;
  }
  row.push(value.trim());
  if (row.some(Boolean)) matrix.push(row);
  if (!matrix.length) return { headers: [], rows: [] };

  const headers = matrix[0].map((header, index) => header || `Column ${index + 1}`);
  const rows = matrix.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
  );
  return { headers, rows };
}

export function mapRow(row: CsvRow, mapping: ColumnMapping) {
  const output: Partial<Record<VehicleField, string>> = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (field !== "ignore") output[field] = row[header]?.trim() ?? "";
  }
  return output;
}
