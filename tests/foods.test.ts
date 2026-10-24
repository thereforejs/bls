import { decimal, multiply, toDecimalString } from "@thereforejs/decy";
import fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { toFoods } from "../scripts/foods.ts";

// Header texts as in BLS_4_0_Daten_2025_DE.xlsx: "CODE name [unit/100g]", then Datenherkunft, Referenz.
const COLUMNS: [string, string][] = [
  ["FAT", "Fett [g/100g]"],
  ["FASAT", "Fettsäuren, gesättigt, gesamt [g/100g]"],
  ["FAMS", "Fettsäuren, einfach ungesättigt, gesamt [g/100g]"],
  ["FAPU", "Fettsäuren, mehrfach ungesättigt, gesamt [g/100g]"],
  ["CHO", "Kohlenhydrate, verfügbar [g/100g]"],
  ["SUGAR", "Zucker, gesamt [g/100g]"],
  ["STARCH", "Stärke (Stärke, Glykogen, Dextrine) [g/100g]"],
  ["POLYL", "Zuckeralkohole, gesamt [g/100g]"],
  ["FIBT", "Ballaststoffe, gesamt [g/100g]"],
  ["PROT625", "Protein (Nx6,25) [g/100g]"],
  ["NA", "Natrium [mg/100g]"],
  ["ALC", "Alkohol (Ethanol) [g/100g]"],
  ["OA", "Organische Säuren, gesamt [g/100g]"],
  ["ENERCJ", "Energie (Kilojoule) [kJ/100g]"],
];

type Row = { code?: string; de?: string; en?: string; values?: Record<string, string | undefined> };

const sheet = (rows: Row[], columns = COLUMNS) => [
  ["BLS Code", "Lebensmittelbezeichnung", "Food name"].concat(
    columns.flatMap(([code, name]) => [
      `${code} ${name}`,
      `${code} Datenherkunft`,
      `${code} Referenz`,
    ]),
  ),
  ...rows.map(({ code = "C131000", de = "Hafer", en = "Oats", values = {} }) =>
    [code, de, en].concat(
      columns.flatMap(([column]) => [
        column in values ? values[column] : "1",
        "Analyse",
        "-",
      ]) as string[],
    ),
  ),
];

const food = (values: Record<string, string | undefined>) => {
  const [first] = toFoods(sheet([{ values }]));
  if (!first) throw new Error("no food");
  return first;
};

describe("a row becomes a food in nutrition's shape", () => {
  test("code and names verbatim, every key of nutrition", () => {
    const [oats] = toFoods(
      sheet([{ code: "M5B1600", de: "Weizenbrot/Weißbrot", en: "Wheat bread/white bread" }]),
    );
    expect(oats).toEqual({
      code: "M5B1600",
      name: { de: "Weizenbrot/Weißbrot", en: "Wheat bread/white bread" },
      per100g: {
        fat: "1",
        saturates: "1",
        monounsaturates: "1",
        polyunsaturates: "1",
        carbohydrate: "1",
        sugars: "1",
        starch: "1",
        polyols: "1",
        fibre: "1",
        protein: "1",
        sodium: "0.001",
        alcohol: "1",
        organicAcids: "1",
      },
      marks: {},
    });
  });

  test("artefacts are written as their shortest decimal", () => {
    expect(
      food({ FAT: "9.3000000000000007", SUGAR: "1.4999999999999999E-2" }).per100g,
    ).toMatchObject({ fat: "9.3", sugars: "0.015" });
  });

  // BLS documentation 4.3: "Ein fehlender Wert ist nicht gleichbedeutend mit Null".
  test("a missing value is null, a real 0 stays 0", () => {
    expect(food({ FAT: "-", SUGAR: "0", NA: "-" }).per100g).toMatchObject({
      fat: null,
      sugars: "0",
      sodium: null,
    });
  });

  test("columns are found by their code, not by their position", () => {
    const shuffled = [...COLUMNS].reverse();
    const [first] = toFoods(sheet([{ values: { FAT: "2", NA: "500" } }], shuffled));
    expect(first?.per100g).toMatchObject({ fat: "2", sodium: "0.5" });
  });
});

describe("sodium from mg to g", () => {
  test.each([
    ["250", "0.25"],
    ["1000", "1"],
    ["0", "0"],
    ["57500", "57.5"],
    ["1.4999999999999999E-2", "0.000015"],
  ])("%s mg is %s g", (mg, g) => {
    expect(food({ NA: mg }).per100g.sodium).toBe(g);
  });

  test("exact: the grams times 1000 read back to the source double", () => {
    fc.assert(
      fc.property(
        // From 1e-9 the grams stay within decy's 30 decimals (the BLS uses 18).
        fc.double({ min: 1e-9, max: 1e6, noNaN: true }),
        fc.integer({ min: 1, max: 17 }),
        (mg, digits) => {
          // The XLSX writes up to 17 significant digits, sometimes with an exponent.
          const raw = mg.toPrecision(digits);
          const g = food({ NA: raw }).per100g.sodium;
          expect(g).toMatch(/^(0|[1-9]\d*)(\.\d*[1-9])?$/);
          const back = toDecimalString(multiply(decimal(g ?? ""), decimal("1000")));
          expect(Number(back)).toBe(Number(raw));
        },
      ),
    );
  });
});

// BLS documentation 4.4: neither zero nor missing; the application decides (SPEC 4).
describe("a mark is null with the mark next to it", () => {
  test.each(["<LOD", "<LOQ", "<LOD or <LOQ", "TR"])("%s", (mark) => {
    const { per100g, marks } = food({ FAT: mark, NA: mark });
    expect(per100g).toMatchObject({ fat: null, sodium: null });
    expect(marks).toEqual({ fat: mark, sodium: mark });
  });
});

describe("what the build cannot read is refused, never guessed", () => {
  test("unknown text in a value names the food and the nutrient", () => {
    expect(() => food({ FAT: "ca. 3" })).toThrow(/C131000.*FAT.*ca\. 3/);
  });

  test("an empty cell is not a missing value", () => {
    expect(() => food({ FAT: undefined })).toThrow(/C131000.*FAT/);
  });

  test("a nutrient column that is not there", () => {
    expect(() =>
      toFoods(
        sheet(
          [{}],
          COLUMNS.filter(([code]) => code !== "POLYL"),
        ),
      ),
    ).toThrow(/POLYL/);
  });

  test("a unit other than the expected one", () => {
    const columns = COLUMNS.map(([code, name]): [string, string] =>
      code === "NA" ? [code, "Natrium [g/100g]"] : [code, name],
    );
    expect(() => toFoods(sheet([{}], columns))).toThrow(/NA.*mg/);
  });

  test("a food without code or name", () => {
    expect(() => toFoods(sheet([{ code: "" }]))).toThrow(/code/);
    expect(() => toFoods(sheet([{ en: "" }]))).toThrow(/name/);
  });
});
