# foods: specification

An open, maintained food composition database as exact, tree-shakable data for
[`@thereforejs/nutrition`](https://github.com/thereforejs/nutrition). It starts from the
Bundeslebensmittelschlüssel 4.0 (BLS, Max Rubner-Institut) and grows from other openly licensed
sources and contributions, every value with its source.

**This package is not published by the Max Rubner-Institut.** It contains an extract of the BLS 4.0
with changes, under CC BY 4.0 (section 10).

**Where this document and a secondary source disagree, this document wins; where it is unsure, it says
so.** Open points are listed in section 12, never guessed.

---

## 1. What it is, and what it is not

**It is** a data package: per food its code, its German and English name, its values per 100 g in
exactly the shape nutrition's input takes, so an application writes
`{ amount: 500, per100g: rye.per100g }`, and where each value comes from.

**It is not:**

- a calculator. It calculates nothing; nutrition does;
- a guess. Every value comes from a real, openly licensed source with its entry id, or from a lab
  report; nothing is estimated;
- a copy of one source. A value that a source gets wrong is replaced from another one, with its
  source, never silently;
- a dependency of nutrition, or dependent on it. An application imports both and passes the values
  through.

---

## 2. Principles

- **Every value has its source.** A value comes from a registered, openly licensed source with its
  entry id, never estimated. A value replaced from another source says so in the food's `sources`;
  nothing is changed silently (decided 2026-10-24, replacing "it prepares, it never repairs").
- **Missing is not zero.** A BLS `-` becomes `null`, never `0` (BLS 4.0 documentation, section 4.3:
  "Ein fehlender Wert ist nicht gleichbedeutend mit Null"). A real `0`, including "Logische Null"
  (4.2.10), stays `0`.
- **Exact decimal strings.** The shortest decimal that reads back to the source's double (section 4).
- **Reproducible.** The same source file gives byte-identical output.
- **Tree-shakable** (section 7). An application pays only for the groups it imports.

---

## 3. Source

BLS 4.0, download https://www.blsdb.de/download (one ZIP, downloaded 2026-10-24):

- `BLS_4_0_Daten_2025_DE.xlsx`: 7,140 foods, 138 nutrients, 418 columns. `BLS Code`,
  `Lebensmittelbezeichnung`, `Food name`, then per nutrient three columns: value, `Datenherkunft`
  (13 categories, documentation 4.2), `Referenz`. Values per 100 g edible part (documentation 7.2).
- `BLS_4_0_Components_DE_EN.xlsx`: nutrient codes, names DE/EN, units, formulas.
- `BLS_4_0_Dokumentation_DE.pdf`: linked, never redistributed.

The source is not checked in. The build reads it from the local, ignored `docs/`.

### 3.1 Nutrients taken over

nutrition's `per100g` keys and their BLS codes, all g/100 g except sodium:

| nutrition key     | BLS code | Note                                                                                                        |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `fat`             | FAT      |                                                                                                             |
| `saturates`       | FASAT    |                                                                                                             |
| `monounsaturates` | FAMS     |                                                                                                             |
| `polyunsaturates` | FAPU     |                                                                                                             |
| `carbohydrate`    | CHO      | available; CHO = SUGAR + STARCH + OLSAC + POLYL (documentation 5.3), polyols included as Annex I No 7 wants |
| `sugars`          | SUGAR    |                                                                                                             |
| `starch`          | STARCH   |                                                                                                             |
| `polyols`         | POLYL    | MANTL + SORTL + XYLTL only (documentation 5.8)                                                              |
| `fibre`           | FIBT     |                                                                                                             |
| `protein`         | PROT625  | N × 6.25                                                                                                    |
| `sodium`          | NA       | mg in the source, shipped in g                                                                              |
| `alcohol`         | ALC      |                                                                                                             |
| `organicAcids`    | OA       |                                                                                                             |

Not taken over:

- **NACL.** It is computed by the BLS (NA × 2.5, documentation 5.8). Shipping sodium and salt invites
  a mismatch, which nutrition refuses; nutrition derives salt itself.
- **ENERCJ, ENERCC.** nutrition always calculates energy (Annex XIV) and never takes it as input.
- **Erythritol, salatrims.** The BLS has no such columns; the keys are left out (nutrition reads a
  missing key as 0).
- Vitamins, minerals, fatty acid and amino acid detail: not needed for the declaration.

### 3.2 Codes

The first letter of the BLS code is the main food group (documentation 2.4). The documentation says
the code "weitestgehend" follows `[letter][6 digits]`: 6,368 codes do, 772 look like `M5B1600`. Codes
are never validated with `[A-Z]\d{6}`. The meaning of the digits is not documented; nothing here
relies on it.

A food that has no BLS code gets our own id: its main food group, an underscore and six digits
(`H_000001`). The underscore keeps it apart from any code the MRI could assign. `vp run food:new`
picks the next number of the group; an id never changes and is never reused, because applications
import foods by it. Both kinds are valid identifiers and export names (`scripts/ids.ts`).

---

## 4. Preparation

- **Floating point artefacts.** The XLSX stores binary doubles (`9.3000000000000007`,
  `1.4999999999999999E-2`). The build writes the shortest decimal that reads back to the same double
  (`9.3`, `0.015`), never `toFixed`. Silent: this changes the spelling, not the value.
- **`-` becomes `null`.** Measured 2026-10-24: fat 3, saturates 23, sodium 26, fibre 14, starch 142,
  polyols 321, mono-unsaturates 159, polyunsaturates 38, alcohol 65, organic acids 129; protein,
  carbohydrate and sugars are complete. Mostly additives and exotic foods.
- **Sodium** from mg to g: a decimal shift by three places, exact.
- **Names** verbatim, including slashes and qualifiers ("Weizenbrot/Weißbrot",
  "Roquefort mind. 50 % Fett i. Tr.").
- **`<LOD`, `<LOQ`, `<LOD or <LOQ`, `TR`:** neither zero nor missing (documentation 4.4). The value
  is `null`, and the mark ships next to it, so the application sees why the value is absent and
  decides itself (e.g. `0` for a fat below the limit of detection). The package never turns a mark
  into a number: `TR` is above 0 by definition. Measured 2026-10-24 in the 13 nutrients: `<LOD` 198,
  `TR` 57, `<LOD or <LOQ` 36, `<LOQ` 18, only in fat, starch, fibre, sodium, alcohol and protein
  (Apfel getrocknet: fat `<LOD`). The field name is settled with the output shape (section 5).

---

## 5. Output

One entry point, `@thereforejs/foods`. Every food is a named export under its BLS code, typed `Food`:

```ts
import { C131000 } from "@thereforejs/foods"; // Hafer ganzes Korn, roh
// { code: "C131000", name: { de, en }, per100g: { fat: "7.09", ..., sodium: "0.008" }, marks: {} }

import * as foods from "@thereforejs/foods"; // an application that picks foods at runtime
const food = foods[code];
```

- `per100g`: nutrition's keys as exact decimal text, or `null` (section 4).
- `marks`: the BLS mark of a `null` value, if any (section 4).
- `name`: German and English on every food. Dropping one language would save 18.6 % (gzip, measured
  2026-10-24) at the price of a second import per food; not worth it.
- The German and English name of each food is its doc comment, so an editor shows "Hafer ganzes Korn,
  roh" next to `C131000`. No readable aliases: choosing names would be an interpretation.
- The types `Food`, `Nutrient` and `Mark` are exported.

### Names

`@thereforejs/foods/names/de` and `/names/en` export `names`, every name of one language by code:
no values, generated with the foods, one module per language. They serve a list to pick from and any
search built on top. The package itself does not search: finding a food by what people type (other
spellings, aliases, compounds) is the job of a layer above it.

---

## 6. Groups

The first letter of the code is the main food group (documentation 2.4). The build writes one module
per group (`src/foods/c.ts`), so no single file holds the whole database; the entry only re-exports
them. Groups are not entry points: an application either names its foods (and gets exactly those) or
picks them at runtime (and needs all). Group entry points for lazy loading come when someone needs them.

| Letter | Foods | Letter | Foods |
| ------ | ----- | ------ | ----- |
| B      | 186   | P      | 119   |
| C      | 231   | Q      | 65    |
| D      | 466   | R      | 97    |
| E      | 104   | S      | 253   |
| F      | 275   | T      | 520   |
| G      | 560   | U      | 685   |
| H      | 142   | V      | 462   |
| K      | 157   | W      | 375   |
| M      | 279   | X      | 1,165 |
| N      | 114   | Y      | 885   |

The documentation names no groups. From the data: B bread, C cereals, D cakes and pastries, E pasta,
eggs and dumplings, F fruit, G vegetables, H nuts, seeds and plant-based alternatives, K potatoes and
mushrooms, M milk and cheese, N coffee and tea, P alcoholic drinks, Q fats and oils, R salt, spices,
sauces and fillings, S sugar and confectionery, T fish, U meat, V game, poultry and offal, W sausages,
X and Y dishes. A reading for orientation, not part of the API.

---

## 7. Tree-shaking

- `"sideEffects": false`, one named export per food.
- **No module holds a collection of all foods, groups or languages.** A map such as `{ de, en }` pulls
  every entry into every bundle (verified with Rolldown in nutrition). Re-exports (`export *`) are not
  a collection.
- Verified 2026-10-24 on the built package with the Vite+ bundler: importing `C131000` and `M5B1600`
  gives a bundle of 1,080 bytes holding exactly these two foods.
- The names are one module per language. Verified 2026-10-26: an application with one food and the
  German names loaded on first use keeps the names in their own chunk of 70 KB (gzip); the English
  ones are not in it.

---

## 8. Build

`data/foods/<code>.json` is the source of truth: one file per food with its `sources`, checked in
and maintained (decided 2026-10-24: the package is a maintained database with the BLS as its first
source, not a copy of the BLS). `vp run import:bls` seeded it from `BLS_4_0_Daten_2025_DE.xlsx` once
and only ever adds missing files. `vp run generate` renders the ignored `src/foods/*.ts` and
`src/names/*.ts` from it, in CI and before packing; the same data gives byte-identical files.
Formatter and linter skip both; the tests check them. Sources are registered in `src/sources.ts`, shipped as
`@thereforejs/foods/sources`.

### Checks

`scripts/check.ts` checks every file of `data/foods` (`vp run generate` refuses to generate on any
error, and the tests run the same check):

- shape: an identifier as code, a German and an English name, exactly nutrition's 13 keys, decimal
  text or `null`, at least one source;
- values: the shortest plain decimal, never negative; a mark only next to a `null`, and only a mark of
  the BLS documentation 4.4;
- sources: every nutrient from exactly one entry, a whole and its parts from the same entry, every
  entry with its id and a source registered in `src/sources.ts`, every registered source under an
  open license (`LICENSES`);
- contradictions, which nutrition refuses: a part above its whole (saturates, mono-, polyunsaturates
  above fat; sugars, starch, polyols above carbohydrate) and any value above 100 g.

Contradictions that are known and not yet resolved are listed in `data/open-issues.json`. A new one
fails the check, and so does a listed one that is resolved but still listed, so the list only ever
shrinks on purpose. Nothing ships listed: a contradiction is resolved from another open source or
the food is left out until one has it (decided 2026-10-25). Seeded 2026-10-24 with the BLS 4.0: 117 contradictions in 52 foods (saturates
above fat 42, mono-unsaturates 33, polyunsaturates 42; Kochbanane roh 0.116 saturates in 0.07 fat),
none in carbohydrate, no value above 100 g. 20 resolved from CoFID and USDA; the other 32 left out
(5 cooked plantain derived from the raw one, Gemüseamaranth gebraten, 26 drinks, sweets and sauces
whose recipe calculation gives fat 0 but fatty acids above it).

`vp run generate` reports the number of marks (312) and of foods with open contradictions (0).

---

## 9. Tests (the oracle)

1. Cleaning: the artefact cases of section 4, each read back to the source double.
2. Sodium mg to g; `-` to `null`; a real `0` stays `0`; a mark is `null` with the mark.
3. Group split: every food lands in the group of its first letter, no group file holds a food of
   another group, codes like `M5B1600` included.
4. The shipped data: the 7,140 foods without the 32 left out, each exported under its own code, every value its shortest
   decimal.
5. Every shipped food passes nutrition's input rules or is listed in the build report.
6. Reproducibility: two builds give byte-identical files.
7. Property (fast-check): for every value, the shipped string reads back to the same double as the
   source cell.
8. Tree-shaking on the built package: two foods imported, only those two in the bundle.

---

## 10. License

- Code: MIT.
- Data: CC BY 4.0. The Max Rubner-Institut is named as publisher, changes are marked. Citation:
  Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche
  Nährstoffdatenbank. Karlsruhe. DOI: 10.25826/Data20251217-134202-0.
- The Max Rubner-Institut confirmed in writing (October 2026) that shipping an extract of the BLS 4.0
  as a software package under CC BY 4.0 needs no further permission, and that the imprint notice does
  not limit the license of the data set. It asks for: the MRI named, the citation with DOI, the note
  that this is no publication of the MRI, a link to the license, the data marked as an extract, every
  change stated, and no further legal or technical restriction on the use the license allows. README
  and `LICENSE-DATA` state all of it; MIT covers the code only.
- Changes made are listed in the README ("Changes to the BLS 4.0"): a subset of nutrients, sodium in
  g instead of mg, `-` as `null`, marks as `null` with the mark, numbers in their shortest decimal
  spelling, one export per food, fat values of 20 foods replaced and 32 foods left out (section 8).
- The documentation 9.3 says the BLS is provided "kostenfrei und ohne Lizenzbarrieren", for uses
  including "App- und Softwareentwicklung" and "Nährwertkennzeichnung".

---

## 11. Decisions

- Separate package and repo: other license, its own release rhythm, about 2 MB of data that should not
  sit in every nutrition install (2026-10-24).
- Split by BLS main food group (2026-10-24); the same day replaced by one export per food, which
  tree-shakes finer than any group.
- Tree-shaking is a hard requirement: no module holds all groups or all languages (2026-10-24).
- German and English names (2026-10-24).
- Missing is `null`, never `0`; a real `0` stays `0` (2026-10-24).
- Sodium only, no NACL; no energy (2026-10-24).
- `<LOD`, `<LOQ`, `TR` ship as `null` with their mark next to it, never as a number (2026-10-24).
- One entry point, one named export per food under its BLS code, both names on every food; groups only
  as internal files (2026-10-24).
- Name `@thereforejs/bls`, repo `thereforejs/bls`, a Vite+ library like nutrition (2026-10-24); renamed
  the same day to `@thereforejs/foods`, repo `thereforejs/foods`: the BLS is its first source, not
  all of it, and the name must not suggest a publication of the MRI.
- Foods without a BLS code get our own id, group letter + `_` + six digits; people find foods by name
  through a search (to come), software imports them by id (2026-10-24).
- The package ships the names per language and no search: no aliases, no language rules. Finding a
  food by name belongs to a layer above, such as an application or a finder library (2026-10-26).
- A whole and its parts (fat and fatty acids, carbohydrate and sugars, starch, polyols) come from the
  same source entry (2026-10-24).
- Contributions go through `vp run food:new` and `vp run food:set`, described in `CONTRIBUTING.md`; a
  source needs an open license from `LICENSES`, a lab report counts as a source (2026-10-24).

---

## 12. Open questions

1. ~~License confirmation~~: confirmed in writing by the Max Rubner-Institut, October 2026 (section
   10).
2. ~~Names per language~~: decided 2026-10-24, both names on every food (section 5).
3. ~~`<LOD`, `<LOQ`, `TR`~~: decided 2026-10-24, `null` with the mark next to it (section 4).
4. ~~A part above its whole~~: decided 2026-10-24, listed in `data/open-issues.json` and resolved from
   other open sources (section 8).
5. **Water (WATER):** not needed by nutrition; ship it or not.
6. ~~Group entry names~~: decided 2026-10-24, one entry with an export per food (sections 5, 6).
7. ~~License statement~~: decided 2026-10-24, `"license": "MIT AND CC-BY-4.0"`, both named in the README.
8. ~~XLSX reader~~: decided 2026-10-24, `fflate` to unzip, the two XML files parsed directly, which
   keeps the raw cell text.
9. **The BLS energy formula** disagrees between its own files: the documentation (5.2) has no OLSAC
   term, `BLS_4_0_Components_DE_EN.xlsx` adds `8*OLSAC` (kJ) although CHO already contains OLSAC; 411
   foods have OLSAC above 0. Which one the data uses decides whether ENERCJ can serve as an oracle for
   nutrition.

---

## 13. Sources

- Max Rubner-Institut: BLS 4.0, https://www.blsdb.de/download, and its documentation (Dezember 2025).
- Regulation (EU) No 1169/2011, Annex I, Annex XIV.
- `@thereforejs/nutrition`, `SPEC.md` sections 3.2, 7 and 8.
