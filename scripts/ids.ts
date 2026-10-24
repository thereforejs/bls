/**
 * The main food groups: the first letter of every id (BLS 4.0 documentation 2.4). The documentation
 * names no groups; these readings come from the foods in each group and are for orientation only.
 */
export const GROUPS = {
  B: "bread and rolls",
  C: "cereals, flour, rice",
  D: "cakes, pastries, rusks",
  E: "pasta, eggs, dumplings",
  F: "fruit",
  G: "vegetables",
  H: "nuts, seeds, plant-based alternatives",
  K: "potatoes and mushrooms",
  M: "milk and cheese",
  N: "coffee, tea, soft drinks",
  P: "alcoholic drinks",
  Q: "fats and oils",
  R: "salt, spices, sauces, fillings",
  S: "sugar and confectionery",
  T: "fish",
  U: "meat",
  V: "game, poultry, offal",
  W: "sausages and bacon",
  X: "dishes and soups",
  Y: "dishes",
} as const;

export type Group = keyof typeof GROUPS;

// A BLS code as the MRI assigns it ("C131000", "M5B1600"), or ours: group, underscore, six digits.
// The underscore keeps ours apart from every code the MRI could assign.
const BLS = /^[A-Z][A-Z0-9]*$/;
const OURS = /^([A-Z])_\d{6}$/;

/** A valid food id; it is also the export name, so it must be an identifier. */
export function isFoodId(id: string): boolean {
  const ours = OURS.exec(id);
  return ours ? Object.hasOwn(GROUPS, ours[1] ?? "") : BLS.test(id);
}

export function groupOf(id: string): string {
  return id.charAt(0);
}

/** The id after the highest of the group. Gaps are never filled: an id that was used stays retired. */
export function nextId(existing: string[], group: string): string {
  if (!Object.hasOwn(GROUPS, group)) throw new Error(`${group} is no main food group`);
  const numbers = existing
    .filter((id) => id.startsWith(`${group}_`))
    .map((id) => Number(id.slice(2)));
  const next = Math.max(0, ...numbers) + 1;
  return `${group}_${String(next).padStart(6, "0")}`;
}
