import type { Mark, Nutrient } from "../src/food.ts";

export const NUTRIENTS: readonly Nutrient[] = [
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

// BLS 4.0 documentation 4.4.
export const MARKS: readonly Mark[] = ["<LOD", "<LOQ", "<LOD or <LOQ", "TR"];
