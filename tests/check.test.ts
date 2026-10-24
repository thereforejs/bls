import { describe, expect, test } from "vite-plus/test";
import { checkFood, LICENSES, review } from "../scripts/check.ts";
import type { Food, Nutrient } from "../src/food.ts";
import { sources } from "../src/sources.ts";

const ALL: Nutrient[] = [
  "fat",
  "saturates",
  "monounsaturates",
  "polyunsaturates",
  "carbohydrate",
  "sugars",
  "starch",
  "polyols",
  "fibre",
  "protein",
  "sodium",
  "alcohol",
  "organicAcids",
];

const oats = (): Food => ({
  code: "C131000",
  name: { de: "Hafer ganzes Korn, roh", en: "Oat whole grain, raw" },
  per100g: {
    fat: "7.09",
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
  sources: [{ source: "bls-4.0", id: "C131000", nutrients: ALL }],
});

const issues = (change: (food: Food) => void) => {
  const food = oats();
  change(food);
  return checkFood(food).map(({ code }) => code);
};

test("a sound food has no issue", () => {
  expect(checkFood(oats())).toEqual([]);
});

describe("shape", () => {
  test.each<[string, (food: Food) => void]>([
    ["a code that is no identifier", (f) => (f.code = "C-131000")],
    ["an empty German name", (f) => (f.name.de = "")],
    ["a missing English name", (f) => Reflect.deleteProperty(f.name, "en")],
    ["a nutrient key too many", (f) => Object.assign(f.per100g, { water: "80" })],
    ["a nutrient key missing", (f) => Reflect.deleteProperty(f.per100g, "fibre")],
    ["a number instead of text", (f) => Object.assign(f.per100g, { fat: 7.09 })],
    ["no sources", (f) => (f.sources = [])],
  ])("%s", (_, change) => {
    expect(issues(change)).toContain("shape");
  });
});

describe("values (SPEC 4)", () => {
  test.each([
    ["an artefact", "7.0900000000000001"],
    ["a trailing zero", "7.090"],
    ["an exponent", "7.09e0"],
    ["a decimal comma", "7,09"],
    ["a negative value", "-1"],
  ])("%s is refused", (_, value) => {
    expect(issues((f) => (f.per100g.fat = value))).toContain("value");
  });

  test("a mark only stands next to a null", () => {
    expect(issues((f) => (f.marks.fat = "<LOD"))).toContain("mark");
    expect(
      issues((f) => {
        f.per100g.fat = null;
        f.marks.fat = "<LOD";
      }),
    ).toEqual([]);
  });

  test("an unknown mark is refused", () => {
    expect(
      issues((f) => {
        f.per100g.fat = null;
        Object.assign(f.marks, { fat: "n.d." });
      }),
    ).toContain("mark");
  });
});

describe("sources", () => {
  test("every nutrient comes from exactly one entry", () => {
    expect(
      issues((f) => (f.sources = [{ source: "bls-4.0", id: "C131000", nutrients: ALL.slice(1) }])),
    ).toContain("source");
    expect(
      issues((f) => f.sources.push({ source: "bls-4.0", id: "C131000", nutrients: ["fat"] })),
    ).toContain("source");
  });

  // A whole and its parts from different sources rebuild the contradiction of the BLS Klippfisch.
  test.each<[Nutrient, Nutrient]>([
    ["saturates", "fat"],
    ["polyunsaturates", "fat"],
    ["sugars", "carbohydrate"],
    ["polyols", "carbohydrate"],
  ])("%s and %s come from the same source", (part, whole) => {
    const split = oats();
    split.sources = [
      { source: "bls-4.0", id: "C131000", nutrients: ALL.filter((key) => key !== part) },
      { source: "cofid-2021", id: "11-111", nutrients: [part] },
    ];
    expect(checkFood(split)).toContainEqual({
      code: "source",
      message: `${part} and ${whole} come from different sources`,
    });
  });

  test("a source that is not registered", () => {
    expect(issues((f) => (f.sources[0]!.source = "my-guess"))).toContain("source");
  });

  test("an entry without its id in the source", () => {
    expect(issues((f) => (f.sources[0]!.id = ""))).toContain("source");
  });

  test("every registered source has an open license", () => {
    for (const source of Object.values(sources)) expect(LICENSES).toContain(source.license);
  });
});

// nutrition refuses these (its SPEC 3.2); the data keeps them visible instead of hiding them.
describe("contradictions", () => {
  test.each<[Nutrient, Nutrient]>([
    ["saturates", "fat"],
    ["monounsaturates", "fat"],
    ["polyunsaturates", "fat"],
    ["sugars", "carbohydrate"],
    ["starch", "carbohydrate"],
    ["polyols", "carbohydrate"],
  ])("%s above %s", (part, whole) => {
    const found = checkFood({
      ...oats(),
      per100g: { ...oats().per100g, [whole]: "1", [part]: "1.001" },
    });
    expect(found).toContainEqual({ code: "contradiction", message: `${part} exceeds ${whole}` });
  });

  test("a part equal to its whole is fine, an unknown whole is not compared", () => {
    expect(issues((f) => (f.per100g.saturates = f.per100g.fat))).toEqual([]);
    expect(issues((f) => (f.per100g.fat = null))).toEqual([]);
  });

  test("more than 100 g in 100 g", () => {
    expect(
      checkFood({ ...oats(), per100g: { ...oats().per100g, protein: "100.1" } }),
    ).toContainEqual({
      code: "contradiction",
      message: "protein exceeds 100 g",
    });
    expect(issues((f) => (f.per100g.protein = "100"))).toEqual([]);
  });
});

describe("review against the list of open contradictions", () => {
  const plantain = (): Food => ({
    ...oats(),
    code: "F545100",
    // BLS 4.0 values of Kochbanane roh.
    per100g: {
      ...oats().per100g,
      fat: "0.07",
      saturates: "0.116",
      monounsaturates: "0.009",
      polyunsaturates: "0.015",
    },
  });

  test("a listed contradiction is open, not an error", () => {
    expect(review([oats(), plantain()], { F545100: ["saturates exceeds fat"] })).toEqual({
      errors: [],
      summary: { foods: 2, marks: 0, open: 1 },
    });
  });

  test("a new contradiction is an error", () => {
    expect(review([plantain()], {}).errors).toEqual([
      "F545100: saturates exceeds fat (new; fix the values or list it in data/open-issues.json)",
    ]);
  });

  test("a resolved contradiction must leave the list", () => {
    expect(review([oats()], { C131000: ["saturates exceeds fat"] }).errors).toEqual([
      "C131000: saturates exceeds fat is resolved; remove it from data/open-issues.json",
    ]);
  });

  test("any other issue is an error, marks are counted", () => {
    const broken = { ...oats(), per100g: { ...oats().per100g, fat: "7.090" } };
    const marked = {
      ...oats(),
      code: "C110000",
      per100g: { ...oats().per100g, fibre: null },
      marks: { fibre: "TR" as const },
    };
    const { errors, summary } = review([broken, marked], {});
    expect(errors).toEqual(['C131000: fat "7.090" is no shortest decimal']);
    expect(summary).toEqual({ foods: 2, marks: 1, open: 0 });
  });
});
