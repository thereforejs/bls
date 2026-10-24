/** The keys of `per100g` in `@thereforejs/nutrition`, all in grams per 100 g. */
export type Nutrient =
  | "fat"
  | "saturates"
  | "monounsaturates"
  | "polyunsaturates"
  | "carbohydrate"
  | "sugars"
  | "starch"
  | "polyols"
  | "fibre"
  | "protein"
  | "sodium"
  | "alcohol"
  | "organicAcids";

/** Below the limit of detection or quantification, or traces (BLS 4.0 documentation, 4.4). */
export type Mark = "<LOD" | "<LOQ" | "<LOD or <LOQ" | "TR";

/** Where a group of values comes from: a source of `sources` and its own id for the food. */
export type FoodSource = { source: string; id: string; nutrients: Nutrient[] };

/** One food, values per 100 g edible part. */
export type Food = {
  /** The BLS code; its first letter is the main food group. */
  code: string;
  name: { de: string; en: string };
  /** Exact decimal text; `null` where no source has a value (never read it as 0). */
  per100g: Record<Nutrient, string | null>;
  /** Why a `null` is more than missing. The application decides what it means. */
  marks: Partial<Record<Nutrient, Mark>>;
  /** Every nutrient comes from exactly one entry. */
  sources: FoodSource[];
};
