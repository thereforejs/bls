import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Food } from "../src/food.ts";

/** One maintained food as it lives in `data/foods/<code>.json`. */
export function serialize(food: Food): string {
  return `${JSON.stringify(food, null, 2)}\n`;
}

/** Writes the foods that have no file yet. A file that exists was maintained since; never touched. */
export function writeMissing(dir: string, foods: Food[]): { written: number; kept: number } {
  let written = 0;
  for (const food of foods) {
    const path = join(dir, `${food.code}.json`);
    if (existsSync(path)) continue;
    writeFileSync(path, serialize(food));
    written++;
  }
  return { written, kept: foods.length - written };
}

/** Every food of `data/foods/`. The order is set where it matters, in `groupByLetter`. */
export function readFoods(dir: string): Food[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      let food: Food;
      try {
        food = JSON.parse(readFileSync(join(dir, file), "utf8"));
      } catch (error) {
        throw new Error(`${file} is no valid JSON`, { cause: error });
      }
      if (`${food.code}.json` !== file) throw new Error(`${file} holds ${food.code}`);
      return food;
    });
}
