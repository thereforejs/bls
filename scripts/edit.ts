import type { Food, Mark, Nutrient } from "../src/food.ts";
import { sources } from "../src/sources.ts";
import { gramsFromMilligrams, shortestDecimal } from "./decimal.ts";
import { isFoodId } from "./ids.ts";
import { NUTRIENTS } from "./nutrients.ts";

// How sources write their marks (BLS "TR", CoFID "Tr"), read case-insensitively.
const MARKS: Record<string, Mark> = {
  tr: "TR",
  "<lod": "<LOD",
  "<loq": "<LOQ",
  "<lod or <loq": "<LOD or <LOQ",
};

/** An empty food: names only. The check lists what is still missing. */
export function newFood(code: string, de: string, en: string): Food {
  if (!isFoodId(code)) throw new Error(`${code} is no valid id`);
  if (!de.trim() || !en.trim()) throw new Error("a German and an English name are required");
  return {
    code,
    name: { de: de.trim(), en: en.trim() },
    per100g: Object.fromEntries(NUTRIENTS.map((key) => [key, null])) as Food["per100g"],
    marks: {},
    sources: [],
  };
}

/**
 * The food with `values` taken from one source entry, as the source writes them ("0.10", "0,3",
 * "Tr", "-"). The nutrients move to that entry; every other value keeps its source.
 */
export function setValues(
  food: Food,
  ref: { source: string; id: string },
  values: Record<string, string>,
): Food {
  if (!Object.hasOwn(sources, ref.source)) {
    throw new Error(`${ref.source} is not registered in src/sources.ts`);
  }
  if (!ref.id.trim()) throw new Error(`the id of the food in ${ref.source} is required`);
  const keys = Object.keys(values);
  if (keys.length === 0) throw new Error("nothing to set");

  const next: Food = structuredClone(food);
  for (const key of keys) {
    if (!NUTRIENTS.includes(key as Nutrient)) throw new Error(`${key} is no nutrient`);
    const { value, mark } = read(key, values[key] ?? "");
    const nutrient = key as Nutrient;
    next.per100g[nutrient] = value;
    if (mark) next.marks[nutrient] = mark;
    else delete next.marks[nutrient];
  }

  const moved = NUTRIENTS.filter((key) => keys.includes(key));
  const others = next.sources
    .filter((entry) => entry.source !== ref.source || entry.id !== ref.id)
    .map((entry) => ({
      ...entry,
      nutrients: entry.nutrients.filter((key) => !moved.includes(key)),
    }))
    .filter((entry) => entry.nutrients.length > 0);
  const own = next.sources.find((entry) => entry.source === ref.source && entry.id === ref.id);
  const nutrients = NUTRIENTS.filter((key) => moved.includes(key) || own?.nutrients.includes(key));
  next.sources = [...others, { source: ref.source, id: ref.id, nutrients }];
  return next;
}

function read(key: string, raw: string): { value: string | null; mark?: Mark } {
  const text = raw.trim();
  if (text === "-") return { value: null };
  const mark = MARKS[text.toLowerCase()];
  if (mark) return { value: null, mark };
  if (text.startsWith("-")) throw new Error(`${key}: ${text} is negative`);
  // Sources mostly give sodium in mg; the data holds grams, so a unit is read, never assumed.
  const [, number = text, unit = "g"] = /^(.*?)\s*(mg|g)$/.exec(text) ?? [];
  try {
    const value = shortestDecimal(/^\d+,\d+$/.test(number) ? number.replace(",", ".") : number);
    return { value: unit === "mg" ? gramsFromMilligrams(value) : value };
  } catch (error) {
    throw new Error(`${key}: ${JSON.stringify(text)} is neither a number, "-" nor a mark`, {
      cause: error,
    });
  }
}
