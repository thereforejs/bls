import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import { readFoods, serialize, writeMissing } from "../scripts/records.ts";
import type { Food } from "../src/food.ts";

const food = (code: string, fat = "7.09"): Food => ({
  code,
  name: { de: "Hafer ganzes Korn, roh", en: "Oat whole grain, raw" },
  per100g: {
    fat,
    saturates: "1.43",
    monounsaturates: "2.514",
    polyunsaturates: "2.86",
    carbohydrate: "53.7",
    sugars: "1.08",
    starch: "52.6",
    polyols: "0",
    fibre: "9.3",
    protein: "11.375",
    sodium: "0.008",
    alcohol: "0",
    organicAcids: null,
  },
  marks: {},
  sources: [{ source: "bls-4.0", id: code, nutrients: ["fat"] }],
});

const folder = () => mkdtempSync(join(tmpdir(), "bls-records-"));

test("a record is pretty JSON with a final newline, read back unchanged", () => {
  const text = serialize(food("C131000"));
  expect(text.endsWith("}\n")).toBe(true);
  expect(text).toContain('\n  "code": "C131000",\n');
  expect(JSON.parse(text)).toEqual(food("C131000"));
});

describe("the import only adds, it never overwrites what was maintained", () => {
  test("new foods are written, existing files stay byte for byte", () => {
    const dir = folder();
    const maintained = serialize(food("C131000", "6.5"));
    writeFileSync(join(dir, "C131000.json"), maintained);

    expect(writeMissing(dir, [food("C131000"), food("C110000")])).toEqual({ written: 1, kept: 1 });
    expect(readFileSync(join(dir, "C131000.json"), "utf8")).toBe(maintained);
    expect(JSON.parse(readFileSync(join(dir, "C110000.json"), "utf8"))).toEqual(food("C110000"));
  });
});

describe("reading the maintained data", () => {
  test("every food file, other files ignored", () => {
    const dir = folder();
    writeMissing(dir, [food("M5B1600"), food("C131000")]);
    writeFileSync(join(dir, "README.md"), "notes");
    expect(
      readFoods(dir)
        .map((f) => f.code)
        .sort(),
    ).toEqual(["C131000", "M5B1600"]);
  });

  test("a file whose name is not its code is refused", () => {
    const dir = folder();
    writeFileSync(join(dir, "C110000.json"), serialize(food("C131000")));
    expect(() => readFoods(dir)).toThrow(/C110000\.json.*C131000/);
  });

  test("broken JSON is refused with its file name", () => {
    const dir = folder();
    writeFileSync(join(dir, "C131000.json"), "{ nope");
    expect(() => readFoods(dir)).toThrow(/C131000\.json/);
  });
});
