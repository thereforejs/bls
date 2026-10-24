import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { newFood } from "./edit.ts";
import { GROUPS, nextId } from "./ids.ts";
import { serialize } from "./records.ts";

const DATA = join(import.meta.dirname, "../data/foods");
const { values } = parseArgs({
  options: { group: { type: "string" }, de: { type: "string" }, en: { type: "string" } },
});
if (!values.group || !values.de || !values.en) {
  const groups = Object.entries(GROUPS).map(([letter, name]) => `  ${letter}  ${name}`);
  throw new Error(
    `usage: vp run food:new --group H --de "Haferdrink ungesüßt" --en "Oat drink unsweetened"\n\n${groups.join("\n")}`,
  );
}

const ids = readdirSync(DATA).map((file) => file.replace(/\.json$/, ""));
const id = nextId(ids, values.group);
const path = join(DATA, `${id}.json`);
if (existsSync(path)) throw new Error(`${path} exists`);
writeFileSync(path, serialize(newFood(id, values.de, values.en)));
execFileSync("vp", ["fmt", path], { stdio: "ignore" });

console.log(`${id} created in data/foods/${id}.json`);
console.log(
  `next: vp run food:set ${id} --source <source> --id <id in the source> fat=... protein=...`,
);
