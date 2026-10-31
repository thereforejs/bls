<p align="center">
  <img src="./assets/logo.svg" alt="foods" width="128" height="128">
</p>

<h1 align="center">foods</h1>

<p align="center">
  Nutrient values of over 7,100 foods per 100 g, as exact data you import by code.<br>
  Every value names its source. Made for <a href="https://github.com/thereforejs/nutrition"><code>@thereforejs/nutrition</code></a>,<br>
  which calculates the nutrition declaration.
</p>

Starts from the German Bundeslebensmittelschlüssel 4.0 (BLS) and grows from other open sources.

> [!IMPORTANT]
> Not published by the Max Rubner-Institut. Contains an extract of the BLS 4.0, with the
> [changes](#changes-to-the-bls-40) listed below; the original is at https://www.blsdb.de, licensed
> under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

> [!WARNING]
> Early development (0.x). The API may still change.

## Install

```sh
npm install @thereforejs/foods
```

## Use

Import a food by its code: a BLS code like `C131000`, or our own like `H_000001` for foods the BLS
does not have. Your bundle holds only the foods you import.

```ts
import { C131000 } from "@thereforejs/foods";
```

You get:

```ts
{
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
    organicAcids: "0",
  },
  marks: {},
  sources: [{ source: "bls-4.0", id: "C131000", nutrients: ["fat", "saturates", /* all 13 */] }],
}
```

- **`per100g`**: grams per 100 g, sodium too. Exact decimal text, never a rounded number.
- **`null`**: no number. Never read it as 0. Read `marks` first.
- **`marks`**: the source's mark for a `null`: `<LOD`, `<LOQ`, `<LOD or <LOQ` (below the limit of
  detection or quantification) or `TR` (traces). Without a mark the source has no value.
- **`sources`**: which entry of which source each value comes from.

## Names

All names of one language by code, without values, for a list to pick from or a search of your own.
Load them when you need them:

```ts
const { names } = await import("@thereforejs/foods/names/de"); // or /names/en
names.C214200; // "Weizen Mehl, Type 550"
```

Names are verbatim from their source. The BLS often writes them apart ("Weizen Mehl", not
"Weizenmehl") and puts synonyms behind a slash ("Weizenbrot/Weißbrot").

## With nutrition

`per100g` goes into `@thereforejs/nutrition` as it is:

```ts
import { calculateNutrition } from "@thereforejs/nutrition";
import { C131000 } from "@thereforejs/foods";

calculateNutrition({ ingredients: [{ amount: 100, per100g: C131000.per100g }] });
```

## Pick a food at runtime

When the user picks the food, import all of them as a table by code:

```ts
import * as foods from "@thereforejs/foods";
import type { Food } from "@thereforejs/foods";

const byCode: Record<string, Food> = foods;
byCode["C131000"]; // undefined for an unknown code
```

This puts all foods into the bundle.

## Sources

The sources with license and citation:

```ts
import { sources } from "@thereforejs/foods/sources";

sources["bls-4.0"].citation;
```

## Left out

A food whose fatty acids add up to more than its fat does not ship: a nutrition declaration cannot
show such a pair. In the BLS such values can come from different samples and methods, for example a
fat below the limit of quantification while its fatty acids are still measurable. Where another open
source has the same food with values that fit together, they replace the BLS values.
Where none has, the food is left out until one does: 32 foods of the BLS 4.0 so far (cooked plantain
and drinks, sweets and sauces with fat 0 but fatty acids above it).

## Contribute

Correct a value or add a food, always with its source:

```sh
vp run food:set F545100 --source cofid-2021 --id 13-323 fat=0.3 saturates=0.10
vp run food:new --group H --de "Haferdrink ungesüßt" --en "Oat drink unsweetened"
vp run generate   # checks every food
```

Step by step in [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

- Code: [MIT](./LICENSE)
- Data ([LICENSE-DATA](./LICENSE-DATA)): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Max Rubner-Institut (2025):
  Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank. Karlsruhe. DOI:
  [10.25826/Data20251217-134202-0](https://doi.org/10.25826/Data20251217-134202-0)
- Values from other sources name their source in the food's `sources`:
  - McCance and Widdowson's Composition of Foods Integrated Dataset 2021, Public Health England.
    Contains public sector information licensed under the
    [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
  - USDA FoodData Central (SR Legacy, Survey Foods/FNDDS), U.S. Department of Agriculture,
    Agricultural Research Service, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

### Changes to the BLS 4.0

- Only the 13 nutrients of the nutrition declaration, named as `@thereforejs/nutrition` names them.
- Sodium in g instead of mg.
- A missing value (`-`) as `null`.
- Numbers in their shortest decimal spelling (`9.3` instead of `9.3000000000000007`).
- Below a limit or traces (`<LOD`, `<LOQ`, `TR`) as `null`, with the mark next to it.
- One named export per food, under its code.
- Foods whose fatty acids add up to more than their fat: the values of 20 foods replaced from the
  sources above, 32 foods left out (see [Left out](#left-out)).
