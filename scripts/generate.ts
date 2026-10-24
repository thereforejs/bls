import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readFoods } from "./records.ts";
import { groupByLetter, renderGroup, renderIndex } from "./render.ts";

const ROOT = join(import.meta.dirname, "..");
const DATA = join(ROOT, "data/foods");
const OUT = join(ROOT, "src/foods");

const foods = readFoods(DATA);
const groups = groupByLetter(foods);

// A group that disappears must not survive as a stale file.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const [letter, list] of groups) {
  writeFileSync(join(OUT, `${letter.toLowerCase()}.ts`), renderGroup(letter, list));
}
writeFileSync(join(OUT, "index.ts"), renderIndex([...groups.keys()]));

console.log(`${foods.length} foods in ${groups.size} groups generated from data/foods`);
