# bls: specification

The Bundeslebensmittelschlüssel 4.0 (BLS, Max Rubner-Institut, the German food composition database)
prepared as exact, tree-shakable data for
[`@thereforejs/nutrition`](https://github.com/thereforejs/nutrition).

**This package is not published by the Max Rubner-Institut.** It is an unofficial preparation of the
BLS 4.0 data under CC BY 4.0 (section 10).

**Where this document and a secondary source disagree, this document wins; where it is unsure, it says
so.** Open points are listed in section 12, never guessed.

---

## 1. What it is, and what it is not

**It is** a data package: per BLS food its code, its German and English name, and its values per
100 g in exactly the shape nutrition's input takes, so an application writes
`{ amount: 500, per100g: rye.per100g }`.

**It is not:**

- a calculator. It calculates nothing; nutrition does;
- a repair shop. It prepares the source, it never fixes a value, fills a gap or guesses. Filling gaps
  from another database is the application's job;
- a dependency of nutrition, or dependent on it. An application imports both and passes the values
  through.

---

## 2. Principles

- **It prepares, it never repairs.** Every value is the source's value. A value that is not taken over
  unchanged is listed in the build report (section 8), never changed silently.
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
are never validated with `[A-Z]\d{6}`.

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
- **`<LOD`, `<LOQ`, `TR`:** neither zero nor missing (documentation 4.4). How they ship is open
  (question 3).

---

## 5. Output

Per food: the BLS code, the German and the English name, and `per100g` with nutrition's keys as exact
decimal strings or `null`. How the names are split so that one language can be tree-shaken away is
open (question 2).

---

## 6. Groups and entry points

One entry point per main food group (e.g. `@thereforejs/bls/sweets`). The documentation names only the
principle with one example (C = Getreide); the readable entry names are derived from the data and
agreed (question 6).

| Letter | Foods | gzip  | Letter | Foods | gzip  |
| ------ | ----- | ----- | ------ | ----- | ----- |
| B      | 186   | 9 KB  | P      | 119   | 5 KB  |
| C      | 231   | 11 KB | Q      | 65    | 4 KB  |
| D      | 466   | 28 KB | R      | 97    | 6 KB  |
| E      | 104   | 5 KB  | S      | 253   | 14 KB |
| F      | 275   | 13 KB | T      | 520   | 21 KB |
| G      | 560   | 27 KB | U      | 685   | 26 KB |
| H      | 142   | 8 KB  | V      | 462   | 17 KB |
| K      | 157   | 9 KB  | W      | 375   | 19 KB |
| M      | 279   | 13 KB | X      | 1,165 | 75 KB |
| N      | 114   | 5 KB  | Y      | 885   | 56 KB |

Sizes are for the declaration nutrients with both names (measured 2026-10-24); all groups together
about 2.2 MB raw, 390 KB gzip.

---

## 7. Tree-shaking

- `"sideEffects": false`, named exports only.
- **No module holds a collection of all groups or all languages.** A map such as `{ de, en }` pulls
  every entry into every bundle (verified with Rolldown in nutrition).
- Each generated JSON is wrapped in a small typed `.ts` module: tsgo cannot emit declarations for a
  JSON file exported directly.
- Verified on the built package: importing one group ships only that group.

---

## 8. Build

`scripts/build.ts` (run with `vpx`) reads the original XLSX from `docs/` and writes the group files.
The generated data is checked in; users install it.

The build prints a report of everything it did not take over unchanged. Cleaned artefacts are silent.
Listed:

- every `<LOD`, `<LOQ`, `TR` in a shipped nutrient;
- every food nutrition would refuse: a part above its whole (saturates, mono-, polyunsaturates above
  fat; sugars, starch, polyols above carbohydrate), a value above 100 g. Measured 2026-10-24: saturates
  above fat 42 times, mono-unsaturates 33, polyunsaturates 42 (Kochbanane roh: 0.116 saturates in
  0.07 fat); sugars, starch and polyols never exceed carbohydrate. What ships is open (question 4).

---

## 9. Tests (the oracle)

1. Cleaning: the artefact cases of section 4, each read back to the source double.
2. Sodium mg to g; `-` to `null`; a real `0` stays `0`.
3. Group split: every food lands in the group of its first letter, no group file holds a food of
   another group, codes like `M5B1600` included.
4. Every shipped food passes nutrition's input rules or is listed in the build report.
5. Reproducibility: two builds give byte-identical files.
6. Property (fast-check): for every value, the shipped string reads back to the same double as the
   source cell.
7. Tree-shaking on the built package: one group imported, no other group in the bundle.

---

## 10. License

- Code: MIT.
- Data: CC BY 4.0. The Max Rubner-Institut is named as publisher, changes are marked. Citation:
  Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche
  Nährstoffdatenbank. Karlsruhe. DOI: 10.25826/Data20251217-134202-0.
- Changes made: a subset of nutrients, sodium in g instead of mg, `-` as `null`, numbers in their
  shortest decimal spelling, split by main food group.
- The documentation 9.3 says the BLS is provided "kostenfrei und ohne Lizenzbarrieren", for uses
  including "App- und Softwareentwicklung" and "Nährwertkennzeichnung". How the package states both
  licenses is open (question 7).

---

## 11. Decisions

- Separate package and repo: other license, its own release rhythm, about 2 MB of data that should not
  sit in every nutrition install (2026-10-24).
- Split by BLS main food group, one entry point each (2026-10-24).
- Tree-shaking is a hard requirement: no module holds all groups or all languages (2026-10-24).
- German and English names (2026-10-24).
- Missing is `null`, never `0`; a real `0` stays `0` (2026-10-24).
- Sodium only, no NACL; no energy (2026-10-24).
- Name `@thereforejs/bls`, repo `thereforejs/bls`, a Vite+ library like nutrition (2026-10-24).

---

## 12. Open questions

1. **License confirmation:** the imprint of blsdb.de still carries an old "private use only, no
   storing on other servers" notice for web documents; the download page says CC BY 4.0 for the data.
   A written confirmation from the Max Rubner-Institut (bls.karlsruhe@mri.bund.de) settles it before
   publishing. Building is fine without it.
2. **Names per language:** how the German and English names are split so one can be tree-shaken away.
3. **`<LOD`, `<LOQ`, `TR`:** how they ship. Declaration nutrients: `<LOD` 198, `TR` 95,
   `<LOD or <LOQ` 36, `<LOQ` 18. TR means detected, amount unknown but above 0 (documentation 4.4).
4. **A part above its whole** (section 8): fix, `null`, or keep and let nutrition refuse.
5. **Water (WATER):** not needed by nutrition; ship it or not.
6. **Group entry names** per letter.
7. **License statement:** how the package states MIT for the code and CC BY 4.0 for the data.
8. **XLSX reader:** a library (license, size) or the XML parsed directly.
9. **The BLS energy formula** disagrees between its own files: the documentation (5.2) has no OLSAC
   term, `BLS_4_0_Components_DE_EN.xlsx` adds `8*OLSAC` (kJ) although CHO already contains OLSAC; 411
   foods have OLSAC above 0. Which one the data uses decides whether ENERCJ can serve as an oracle for
   nutrition.

---

## 13. Sources

- Max Rubner-Institut: BLS 4.0, https://www.blsdb.de/download, and its documentation (Dezember 2025).
- Regulation (EU) No 1169/2011, Annex I, Annex XIV.
- `@thereforejs/nutrition`, `SPEC.md` sections 3.2, 7 and 8.
