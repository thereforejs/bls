import { decimal, multiply, toDecimalString } from "@thereforejs/decy";
import type { Food, Mark, Nutrient } from "../src/food.ts";
import { shortestDecimal } from "./decimal.ts";

// SPEC 3.1: nutrition's key, the BLS column and the unit the column must carry.
const NUTRIENTS: Record<Nutrient, readonly [string, "g" | "mg"]> = {
  fat: ["FAT", "g"],
  saturates: ["FASAT", "g"],
  monounsaturates: ["FAMS", "g"],
  polyunsaturates: ["FAPU", "g"],
  carbohydrate: ["CHO", "g"],
  sugars: ["SUGAR", "g"],
  starch: ["STARCH", "g"],
  polyols: ["POLYL", "g"],
  fibre: ["FIBT", "g"],
  protein: ["PROT625", "g"],
  sodium: ["NA", "mg"],
  alcohol: ["ALC", "g"],
  organicAcids: ["OA", "g"],
};

const MARKS: readonly Mark[] = ["<LOD", "<LOQ", "<LOD or <LOQ", "TR"];

/** The foods of the BLS sheet, header row first, in the order of the sheet. */
export function toFoods(rows: (string | undefined)[][]): Food[] {
  const [header = [], ...lines] = rows;
  const columns = (Object.keys(NUTRIENTS) as Nutrient[]).map((key) => {
    const [code, unit] = NUTRIENTS[key];
    return [key, column(header, code, unit)] as const;
  });
  const foods: Food[] = [];
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i] ?? [];
    const [code, de, en] = row;
    if (!code) throw new Error(`Row ${i + 2} has no code`);
    if (!de || !en) throw new Error(`${code} has no German or English name`);

    const food: Food = {
      code,
      name: { de, en },
      per100g: {} as Food["per100g"],
      marks: {},
      sources: [{ source: "bls-4.0", id: code, nutrients: columns.map(([key]) => key) }],
    };
    for (const [key, index] of columns) {
      const raw = row[index];
      const [bls, unit] = NUTRIENTS[key];
      if (isMark(raw)) food.marks[key] = raw;
      food.per100g[key] = raw === "-" || isMark(raw) ? null : grams(raw, unit, `${code} ${bls}`);
    }
    foods.push(food);
  }
  return foods;
}

function column(header: (string | undefined)[], code: string, unit: string): number {
  const pattern = new RegExp(`^${code} .*\\[(\\S+)/100g\\]$`);
  const index = header.findIndex((text) => text !== undefined && pattern.test(text));
  if (index === -1) throw new Error(`No column for ${code}`);
  const found = pattern.exec(header[index] ?? "")?.[1];
  if (found !== unit) throw new Error(`${code} is in ${found}, expected ${unit}`);
  return index;
}

function isMark(raw: string | undefined): raw is Mark {
  return MARKS.some((mark) => mark === raw);
}

function grams(raw: string | undefined, unit: string, cell: string): string {
  if (raw === undefined) throw new Error(`${cell}: empty cell`);
  let value: string;
  try {
    value = shortestDecimal(raw);
  } catch (error) {
    throw new Error(`${cell}: ${JSON.stringify(raw)} is neither a number, "-" nor a mark`, {
      cause: error,
    });
  }
  if (unit === "g") return value;
  // mg to g is exact in decy. The product keeps at least 3 decimals ("0.250", "10.000"), so only
  // zeros behind the point are trimmed.
  return toDecimalString(multiply(decimal(value), decimal("0.001"))).replace(/\.?0+$/, "");
}
