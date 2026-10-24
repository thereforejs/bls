import { compare, decimal } from "@thereforejs/decy";
import type { Food, Nutrient } from "../src/food.ts";
import { sources } from "../src/sources.ts";
import { shortestDecimal } from "./decimal.ts";
import { MARKS, NUTRIENTS } from "./nutrients.ts";

/** `contradiction` is what nutrition would refuse; the rest is data that must not be maintained so. */
export type Issue = {
  code: "shape" | "value" | "mark" | "source" | "contradiction";
  message: string;
};

/** Open licenses a source may carry (SPDX). Anything else needs a decision first. */
export const LICENSES = ["CC0-1.0", "CC-BY-4.0", "OGL-UK-3.0", "etalab-2.0"];

// Annex I and XV of Regulation (EU) No 1169/2011, as nutrition checks them (its SPEC 3.2).
const PARTS: [part: Nutrient, whole: Nutrient][] = [
  ["saturates", "fat"],
  ["monounsaturates", "fat"],
  ["polyunsaturates", "fat"],
  ["sugars", "carbohydrate"],
  ["starch", "carbohydrate"],
  ["polyols", "carbohydrate"],
];
const HUNDRED = decimal("100");

/** Everything wrong with one maintained food; empty when it is sound. */
export function checkFood(food: Food): Issue[] {
  const shape = checkShape(food);
  if (shape.length > 0) return shape;
  const values = checkValues(food);
  // Only valid decimals can be compared.
  const contradictions = values.some(({ code }) => code === "value")
    ? []
    : checkContradictions(food);
  return [...values, ...checkSources(food), ...contradictions];
}

function checkShape({ code, name, per100g, marks, sources: entries }: Food): Issue[] {
  const wrong = (message: string): Issue[] => [{ code: "shape", message }];
  if (typeof code !== "string" || !/^[A-Z][A-Z0-9]*$/.test(code))
    return wrong("code is no identifier");
  if (typeof name?.de !== "string" || !name.de || typeof name.en !== "string" || !name.en) {
    return wrong("a German and an English name are required");
  }
  const keys = Object.keys(per100g ?? {});
  if (keys.length !== NUTRIENTS.length || !NUTRIENTS.every((key) => keys.includes(key))) {
    return wrong(`per100g needs exactly ${NUTRIENTS.join(", ")}`);
  }
  if (!Object.values(per100g).every((value) => value === null || typeof value === "string")) {
    return wrong("values are decimal text or null");
  }
  if (typeof marks !== "object" || marks === null) return wrong("marks is an object");
  if (!Array.isArray(entries) || entries.length === 0) return wrong("sources are required");
  return [];
}

function checkValues({ per100g, marks }: Food): Issue[] {
  const issues: Issue[] = [];
  for (const key of NUTRIENTS) {
    const value = per100g[key];
    if (value !== null && !isShortestPlain(value)) {
      issues.push({
        code: "value",
        message: `${key} ${JSON.stringify(value)} is no shortest decimal`,
      });
    }
  }
  for (const [key, mark] of Object.entries(marks)) {
    if (!MARKS.some((known) => known === mark)) {
      issues.push({ code: "mark", message: `${key} has the unknown mark ${JSON.stringify(mark)}` });
    } else if (per100g[key as Nutrient] !== null) {
      issues.push({ code: "mark", message: `${key} has a mark but a value` });
    }
  }
  return issues;
}

function isShortestPlain(value: string): boolean {
  try {
    return !value.startsWith("-") && shortestDecimal(value) === value;
  } catch {
    return false;
  }
}

function checkSources({ sources: entries }: Food): Issue[] {
  const issues: Issue[] = [];
  const covered = new Map<string, number>();
  for (const { source, id, nutrients } of entries) {
    if (!Object.hasOwn(sources, source)) {
      issues.push({ code: "source", message: `${source} is not registered in src/sources.ts` });
    }
    if (!id) issues.push({ code: "source", message: `${source} needs the id of the food in it` });
    for (const key of nutrients) covered.set(key, (covered.get(key) ?? 0) + 1);
  }
  for (const key of NUTRIENTS) {
    const count = covered.get(key) ?? 0;
    if (count !== 1) issues.push({ code: "source", message: `${key} comes from ${count} sources` });
  }
  return issues;
}

function checkContradictions({ per100g }: Food): Issue[] {
  const issues: Issue[] = [];
  for (const [part, whole] of PARTS) {
    const p = per100g[part];
    const w = per100g[whole];
    if (p !== null && w !== null && compare(decimal(p), decimal(w)) > 0) {
      issues.push({ code: "contradiction", message: `${part} exceeds ${whole}` });
    }
  }
  for (const key of NUTRIENTS) {
    const value = per100g[key];
    if (value !== null && compare(decimal(value), HUNDRED) > 0) {
      issues.push({ code: "contradiction", message: `${key} exceeds 100 g` });
    }
  }
  return issues;
}

/** The foods against `data/open-issues.json`: what blocks the build, and what to report. */
export function review(
  foods: Food[],
  open: Record<string, string[]>,
): { errors: string[]; summary: { foods: number; marks: number; open: number } } {
  const errors: string[] = [];
  const seen = new Set<string>();
  let marks = 0;
  for (const food of foods) {
    seen.add(food.code);
    marks += Object.keys(food.marks ?? {}).length;
    const listed = open[food.code] ?? [];
    const issues = checkFood(food);
    for (const { code, message } of issues) {
      if (code !== "contradiction") errors.push(`${food.code}: ${message}`);
      else if (!listed.includes(message)) {
        errors.push(
          `${food.code}: ${message} (new; fix the values or list it in data/open-issues.json)`,
        );
      }
    }
    for (const message of listed) {
      if (!issues.some((issue) => issue.message === message)) {
        errors.push(`${food.code}: ${message} is resolved; remove it from data/open-issues.json`);
      }
    }
  }
  for (const code of Object.keys(open)) {
    if (!seen.has(code)) errors.push(`${code} is listed in data/open-issues.json but has no file`);
  }
  return { errors, summary: { foods: foods.length, marks, open: Object.keys(open).length } };
}
