import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { review } from "./check.ts";
import { readFoods } from "./records.ts";
import { groupByLetter, renderGroup, renderIndex, renderNames } from "./render.ts";

const ROOT = join(import.meta.dirname, "..");
const DATA = join(ROOT, "data/foods");
const OUT = join(ROOT, "src/foods");
const NAMES = join(ROOT, "src/names");

const foods = readFoods(DATA);
const open = JSON.parse(readFileSync(join(ROOT, "data/open-issues.json"), "utf8"));
const { errors, summary } = review(foods, open);
if (errors.length > 0) {
  console.error(errors.join("\n"));
  throw new Error(`${errors.length} issues in data/foods; nothing generated`);
}
const groups = groupByLetter(foods);

// A group that disappears must not survive as a stale file.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const [letter, list] of groups) {
  writeFileSync(join(OUT, `${letter.toLowerCase()}.ts`), renderGroup(letter, list));
}
writeFileSync(join(OUT, "index.ts"), renderIndex([...groups.keys()]));
mkdirSync(NAMES, { recursive: true });
for (const language of ["de", "en"] as const) {
  writeFileSync(join(NAMES, `${language}.ts`), renderNames(language, foods));
}

console.log(`${foods.length} foods in ${groups.size} groups generated from data/foods`);
console.log(`${summary.marks} values marked below a limit or as traces (<LOD, <LOQ, TR)`);
console.log(`${summary.open} foods with open contradictions, see data/open-issues.json`);
