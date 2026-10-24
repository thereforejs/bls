import { readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { shortestDecimal } from "../scripts/decimal.ts";
import type { Food } from "../src/food.ts";
import * as bls from "../src/index.ts";

// The output of `vp run generate`, as users install it.
const FOODS = join(import.meta.dirname, "../src/foods");
// What the README shows for a lookup at runtime: the namespace is a table by code.
const byCode: Record<string, Food> = bls;
const foods = Object.entries(byCode);

test("every food of the BLS 4.0 ships, each under its own code", () => {
  // BLS 4.0 documentation 2.1: 7.140 foods.
  expect(foods).toHaveLength(7140);
  for (const [name, food] of foods) expect(food.code).toBe(name);
});

test("no group file holds a food of another group", async () => {
  const files = readdirSync(FOODS).filter((file) => file !== "index.ts");
  expect(files).toHaveLength(20);
  for (const file of files) {
    const letter = file.replace(".ts", "").toUpperCase();
    const module: Record<string, Food> = await import(join(FOODS, file));
    for (const food of Object.values(module)) expect(food.code.charAt(0)).toBe(letter);
  }
});

test("values are their shortest plain decimal or null, a mark only on a null", () => {
  for (const [, { per100g, marks }] of foods) {
    for (const value of Object.values(per100g)) {
      if (value !== null) expect(shortestDecimal(value)).toBe(value);
    }
    for (const key of Object.keys(marks)) expect(per100g[key as keyof typeof per100g]).toBeNull();
  }
});
