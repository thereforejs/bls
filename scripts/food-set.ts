import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { setValues } from "./edit.ts";
import { serialize } from "./records.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { source: { type: "string" }, id: { type: "string" } },
});
const [code, ...pairs] = positionals;
if (!code || !values.source || !values.id || pairs.length === 0) {
  throw new Error(
    "usage: vp run food:set F545100 --source cofid-2021 --id 13-323 fat=0.3 saturates=0.10 monounsaturates=Tr",
  );
}

const assignments = Object.fromEntries(
  pairs.map((pair) => {
    const at = pair.indexOf("=");
    if (at < 1) throw new Error(`${pair} is no nutrient=value`);
    return [pair.slice(0, at), pair.slice(at + 1)];
  }),
);
const path = join(import.meta.dirname, "../data/foods", `${code}.json`);
const food = setValues(
  JSON.parse(readFileSync(path, "utf8")),
  { source: values.source, id: values.id },
  assignments,
);
writeFileSync(path, serialize(food));
// The file as the formatter keeps it, so a pull request shows values, not whitespace.
execFileSync("vp", ["fmt", path], { stdio: "ignore" });

console.log(
  `${code}: ${Object.keys(assignments).join(", ")} set from ${values.source} ${values.id}`,
);
console.log("check everything with: vp run generate");
