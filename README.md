# bls

The Bundeslebensmittelschlüssel 4.0 (BLS, the German food composition database) prepared as exact,
tree-shakable nutrient data for [`@thereforejs/nutrition`](https://github.com/thereforejs/nutrition).

> [!IMPORTANT]
> This package is **not published by the Max Rubner-Institut**. It is an unofficial preparation of
> the BLS 4.0 data. The original is available at https://www.blsdb.de.

> [!WARNING]
> Early development (0.x). Nothing is published yet and the API will change.

## Usage

```ts
import { C131000 } from "@thereforejs/bls"; // Hafer ganzes Korn, roh

C131000.per100g; // { fat: "7.09", saturates: "1.43", ..., sodium: "0.008", organicAcids: "0" }
```

Every food is a named export under its BLS code, so a bundle holds only the foods it imports. An
application that picks foods at runtime imports the namespace:

```ts
import * as bls from "@thereforejs/bls";
import type { Food } from "@thereforejs/bls";

const byCode: Record<string, Food> = bls;
const food = byCode[code]; // undefined for an unknown code
```

Values are grams per 100 g as exact decimal text; `null` means the BLS has no value, never 0.

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
- Data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), Max Rubner-Institut as publisher,
  changes listed above.
