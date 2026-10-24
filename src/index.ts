// Only foods are exported as values, so `import * as foods` is a table by code. Sources live in
// "@thereforejs/bls/sources".
export type { Food, FoodSource, Mark, Nutrient } from "./food.ts";
export * from "./foods/index.ts";
