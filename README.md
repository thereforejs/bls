# foods

An open, maintained food composition database as exact, tree-shakable data for
[`@thereforejs/nutrition`](https://github.com/thereforejs/nutrition). It starts from the German
Bundeslebensmittelschlüssel 4.0 (BLS) and grows from other openly licensed sources, every value with
its source.

> [!IMPORTANT]
> This package is **not published by the Max Rubner-Institut**. It contains data derived from the
> BLS 4.0; the original is available at https://www.blsdb.de.

> [!WARNING]
> Early development (0.x). Nothing is published yet and the API will change.

## Usage

```ts
import { C131000 } from "@thereforejs/foods"; // Hafer ganzes Korn, roh

C131000.per100g; // { fat: "7.09", saturates: "1.43", ..., sodium: "0.008", organicAcids: "0" }
```

Every food is a named export under its BLS code, so a bundle holds only the foods it imports. An
application that picks foods at runtime imports the namespace:

```ts
import * as foods from "@thereforejs/foods";
import type { Food } from "@thereforejs/foods";

const byCode: Record<string, Food> = foods;
const food = byCode[code]; // undefined for an unknown code
```

Values are grams per 100 g as exact decimal text, never a number to round. A `null` is never 0:
read `marks` first. Without a mark the source has no value; with one it found the nutrient below its
limit of detection or quantification (`<LOD`, `<LOQ`) or only in traces (`TR`).

A few foods carry values that contradict each other in the source, such as saturated fatty acids
above the fat. They ship unchanged and are listed in [`data/open-issues.json`](./data/open-issues.json);
`@thereforejs/nutrition` refuses them until they are resolved.

## Contributing

Corrections and new foods are welcome, each value with its source. See
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Source

Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche
Nährstoffdatenbank. Karlsruhe. DOI: [10.25826/Data20251217-134202-0](https://doi.org/10.25826/Data20251217-134202-0)

### Changes to the original

- Only the nutrients of the nutrition declaration, named as `@thereforejs/nutrition` names them.
- Sodium in g instead of mg.
- A missing value (`-`) as `null`.
- Numbers in their shortest decimal spelling (`9.3` instead of `9.3000000000000007`).
- Below a limit or traces (`<LOD`, `<LOQ`, `TR`) as `null`, with the mark kept next to it.
- One named export per food, under its BLS code.

## License

- Code: [MIT](./LICENSE)
- Data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), Max Rubner-Institut as publisher of
  the BLS 4.0, changes listed above.
- Values replaced from other sources name their source in the food's `sources`; the full list with
  citations is exported as `@thereforejs/foods/sources`:
  - McCance and Widdowson's Composition of Foods Integrated Dataset 2021, Public Health England.
    Contains public sector information licensed under the
    [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
  - USDA FoodData Central (SR Legacy, Survey Foods/FNDDS), U.S. Department of Agriculture,
    Agricultural Research Service, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
