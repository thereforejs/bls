import { describe, expect, test } from "vite-plus/test";
import { checkFood } from "../scripts/check.ts";
import { newFood, setValues } from "../scripts/edit.ts";
import { NUTRIENTS } from "../scripts/nutrients.ts";
import type { Food } from "../src/food.ts";

// BLS 4.0 values of Kochbanane roh, before the fat block was replaced from CoFID.
const plantain = (): Food => ({
  code: "F545100",
  name: { de: "Kochbanane roh", en: "Plantain raw" },
  per100g: {
    fat: "0.07",
    saturates: "0.116",
    monounsaturates: "0.009",
    polyunsaturates: "0.015",
    carbohydrate: "29.5",
    sugars: "7.7",
    starch: "21.8",
    polyols: "0",
    fibre: "2.3",
    protein: "1.3",
    sodium: "0.004",
    alcohol: "0",
    organicAcids: "0.569",
  },
  marks: {},
  sources: [{ source: "bls-4.0", id: "F545100", nutrients: [...NUTRIENTS] }],
});

const cofid = { source: "cofid-2021", id: "13-323" };

describe("setting values from a source", () => {
  test("the values as the source writes them, moved to an entry of their own", () => {
    const food = setValues(plantain(), cofid, {
      fat: "0.3",
      saturates: "0.10",
      monounsaturates: "Tr",
      polyunsaturates: "0.10",
    });
    expect(food.per100g).toMatchObject({
      fat: "0.3",
      saturates: "0.1",
      monounsaturates: null,
      polyunsaturates: "0.1",
      carbohydrate: "29.5",
    });
    expect(food.marks).toEqual({ monounsaturates: "TR" });
    expect(food.sources).toEqual([
      { source: "bls-4.0", id: "F545100", nutrients: NUTRIENTS.slice(4) },
      { ...cofid, nutrients: ["fat", "saturates", "monounsaturates", "polyunsaturates"] },
    ]);
    expect(checkFood(food)).toEqual([]);
  });

  test("the original food is not touched", () => {
    const original = plantain();
    setValues(original, cofid, { fat: "0.3" });
    expect(original).toEqual(plantain());
  });

  test.each([
    ["0,3", "0.3", undefined],
    ["0.30", "0.3", undefined],
    ["1.4999999999999999E-2", "0.015", undefined],
    ["0", "0", undefined],
    ["-", null, undefined],
    ["Tr", null, "TR"],
    ["TR", null, "TR"],
    ["<LOD", null, "<LOD"],
    ["<LOQ", null, "<LOQ"],
    ["0.3g", "0.3", undefined],
    ["0.3 g", "0.3", undefined],
    ["300mg", "0.3", undefined],
    ["300 mg", "0.3", undefined],
    ["1,5 mg", "0.0015", undefined],
  ])("%s is written as %s", (raw, value, mark) => {
    const food = setValues(plantain(), cofid, { fat: raw });
    expect(food.per100g.fat).toBe(value);
    expect(food.marks.fat).toBe(mark);
  });

  test("a mark that was there goes when a value comes", () => {
    const marked = setValues(plantain(), cofid, { fat: "Tr" });
    expect(setValues(marked, cofid, { fat: "0.3" }).marks).toEqual({});
  });

  test("a second call with the same source extends its entry", () => {
    const once = setValues(plantain(), cofid, { fat: "0.3" });
    const twice = setValues(once, cofid, { saturates: "0.1" });
    expect(twice.sources.at(-1)).toEqual({ ...cofid, nutrients: ["fat", "saturates"] });
    expect(twice.sources).toHaveLength(2);
  });

  test("an entry that loses all its nutrients disappears", () => {
    const all = Object.fromEntries(NUTRIENTS.map((key) => [key, "1"]));
    expect(setValues(plantain(), cofid, all).sources).toEqual([
      { ...cofid, nutrients: [...NUTRIENTS] },
    ]);
  });

  test.each([
    ["an unregistered source", { source: "my-guess", id: "1" }, { fat: "1" }, /my-guess/],
    ["no id", { source: "cofid-2021", id: "" }, { fat: "1" }, /id/],
    ["an unknown nutrient", cofid, { water: "80" }, /water/],
    ["text that is no value", cofid, { fat: "ca. 3" }, /ca\. 3/],
    ["a negative value", cofid, { fat: "-1" }, /-1/],
    ["another unit", cofid, { fat: "3 kg" }, /3 kg/],
    ["nothing to set", cofid, {}, /nothing/],
  ])("%s is refused", (_, ref, values, message) => {
    expect(() => setValues(plantain(), ref, values)).toThrow(message);
  });
});

describe("a new food", () => {
  test("has its id and names, and the check says what is missing", () => {
    const food = newFood("H_000001", "Haferdrink ungesüßt", "Oat drink unsweetened");
    expect(food).toEqual({
      code: "H_000001",
      name: { de: "Haferdrink ungesüßt", en: "Oat drink unsweetened" },
      per100g: Object.fromEntries(NUTRIENTS.map((key) => [key, null])),
      marks: {},
      sources: [],
    });
    expect(checkFood(food)).toEqual([{ code: "shape", message: "sources are required" }]);
  });

  test("filled from one source, it is sound", () => {
    const all = Object.fromEntries(NUTRIENTS.map((key) => [key, "0.5"]));
    const food = setValues(newFood("H_000001", "Haferdrink", "Oat drink"), cofid, all);
    expect(checkFood(food)).toEqual([]);
  });

  test("an invalid id or an empty name is refused", () => {
    expect(() => newFood("H_1", "Haferdrink", "Oat drink")).toThrow(/H_1/);
    expect(() => newFood("H_000001", "", "Oat drink")).toThrow(/name/);
  });
});
