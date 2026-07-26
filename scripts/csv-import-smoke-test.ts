import { strict as assert } from "node:assert";
import { autoMapHeaders, mapRow, parseCsv } from "../lib/imports/vehicle-csv";

const csv = `Stock #,VIN,Year,Make,Model,Price,Notes
DC-101,1HGCM82633A123456,2021,Honda,Accord,"$19,995","Clean, one owner"
DC-102,1FTFW1E50MFA12345,2020,Ford,F-150,24995,Truck`;

const parsed = parseCsv(csv);
assert.equal(parsed.rows.length, 2);
const mapping = autoMapHeaders(parsed.headers);
const first = mapRow(parsed.rows[0], mapping);
assert.equal(first.stockNumber, "DC-101");
assert.equal(first.vin, "1HGCM82633A123456");
assert.equal(first.retailPrice, "$19,995");
assert.equal(first.notes, "Clean, one owner");
console.log("DealerClick CSV parsing and mapping smoke test passed.");
