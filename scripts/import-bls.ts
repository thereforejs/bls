import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { toFoods } from "./foods.ts";
import { writeMissing } from "./records.ts";
import { readSheet } from "./xlsx.ts";

// Seeds data/foods from the BLS 4.0 once. Maintained files are never overwritten, but foods left out
// for contradicting values (SPEC 8) come back: not for the maintained data.
const ROOT = join(import.meta.dirname, "..");
// The ZIP as downloaded from https://www.blsdb.de/download, kept in the ignored docs/.
const SOURCE = join(ROOT, "docs/BLS_4_0_2025_DE.zip");
const DATA = "BLS_4_0_Daten_2025_DE.xlsx";
const OUT = join(ROOT, "data/foods");

const zip = unzipSync(readFileSync(SOURCE), { filter: (file) => file.name.endsWith(DATA) });
const xlsx = Object.values(zip)[0];
if (!xlsx) throw new Error(`${SOURCE} has no ${DATA}`);

mkdirSync(OUT, { recursive: true });
const { written, kept } = writeMissing(OUT, toFoods(readSheet(xlsx)));
console.log(`${written} foods written to data/foods, ${kept} already there and kept`);
