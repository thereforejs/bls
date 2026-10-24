# Contributing

`@thereforejs/foods` is an open food composition database. Anyone may correct a value or add a food.
One rule carries everything: **every value comes from a real source, with the entry it was taken
from.** A published database under an open license, or a lab report. Never a guess, never "about",
never a value from a source you may not share.

## Setup

```sh
vp install
vp run generate   # builds src/foods from data/foods and checks every food
vp check          # format, lint, types
vp test           # the tests, including every food
```

`vp run generate` is the check for data. It stops with a message that names the food and the problem,
and it reports what is still open.

## How a food is stored

One file per food: `data/foods/<id>.json`. Everything is per 100 g of the edible part.

```jsonc
{
  "code": "F545100",
  "name": { "de": "Kochbanane roh", "en": "Plantain raw" },
  "per100g": {
    "fat": "0.3", // grams, as exact decimal text
    "monounsaturates": null, // null: no value (never read it as 0)
    // ... 13 nutrients in all, sodium in grams too
  },
  "marks": { "monounsaturates": "TR" }, // why a null is more than missing
  "sources": [
    { "source": "bls-4.0", "id": "F545100", "nutrients": ["carbohydrate", "..."] },
    {
      "source": "cofid-2021",
      "id": "13-323",
      "nutrients": ["fat", "saturates", "monounsaturates", "polyunsaturates"],
    },
  ],
}
```

- **`per100g`**: the 13 nutrients of the nutrition declaration in grams: `fat`, `saturates`,
  `monounsaturates`, `polyunsaturates`, `carbohydrate`, `sugars`, `starch`, `polyols`, `fibre`,
  `protein`, `sodium`, `alcohol`, `organicAcids`. A value is `null` when the source has none.
- **`marks`**: `<LOD`, `<LOQ`, `<LOD or <LOQ` (below the limit of detection or quantification) or `TR`
  (traces), always next to a `null`.
- **`sources`**: which entry of which source each nutrient comes from. Every nutrient exactly once.
  The sources are registered in [`src/sources.ts`](./src/sources.ts).

Do not edit these files by hand; the tools below write them correctly.

## Correct the values of a food

Example: the BLS 4.0 gives Kochbanane roh (`F545100`) 0.116 g saturated fatty acids in 0.07 g fat,
which cannot be. CoFID 2021 has the same food, entry 13-323, with consistent values.

1. Find the food: `data/foods/F545100.json`. To find an id by name, search `data/foods` for the name.
2. Make sure the source is registered in `src/sources.ts` (see [Add a source](#add-a-source)).
3. Set the values exactly as the source writes them:

   ```sh
   vp run food:set F545100 --source cofid-2021 --id 13-323 \
     fat=0.3 saturates=0.10 monounsaturates=Tr polyunsaturates=0.10
   ```

   The tool writes `0.10` as `0.1`, turns `Tr` into `null` with the mark `TR`, reads `-` as no value,
   `0,3` as `0.3` and `300mg` as `0.3` (sodium is mostly given in mg; the data holds grams). The
   nutrients move to the new source; all others keep theirs.

4. Run `vp run generate`. If the food was in `data/open-issues.json`, it now tells you to remove it
   from there.

**Replace a whole together with its parts**: fat with saturates, mono- and polyunsaturates;
carbohydrate with sugars, starch and polyols. They must come from the same source entry, or the
check refuses it: parts and wholes from different sources contradict each other.

## Add a food

1. Pick its main food group (the first letter of its id):

   | Group | Foods                                 | Group | Foods                          |
   | ----- | ------------------------------------- | ----- | ------------------------------ |
   | B     | bread and rolls                       | P     | alcoholic drinks               |
   | C     | cereals, flour, rice                  | Q     | fats and oils                  |
   | D     | cakes, pastries, rusks                | R     | salt, spices, sauces, fillings |
   | E     | pasta, eggs, dumplings                | S     | sugar and confectionery        |
   | F     | fruit                                 | T     | fish                           |
   | G     | vegetables                            | U     | meat                           |
   | H     | nuts, seeds, plant-based alternatives | V     | game, poultry, offal           |
   | K     | potatoes and mushrooms                | W     | sausages and bacon             |
   | M     | milk and cheese                       | X     | dishes and soups               |
   | N     | coffee, tea, soft drinks              | Y     | dishes                         |

2. Create it; the tool picks the next free id of the group:

   ```sh
   vp run food:new --group H --de "Haferdrink ungesüßt" --en "Oat drink unsweetened"
   # H_000001 created in data/foods/H_000001.json
   ```

3. Fill in every nutrient from your source, with `food:set` as above (several calls if the values come
   from several sources). Until all 13 have a source, `vp run generate` says what is missing.

**Ids.** Codes like `C131000` are BLS codes, assigned by the Max Rubner-Institut; we never invent
one. Our own ids are the group letter, an underscore and six digits (`H_000001`). An id never changes
and is never reused, because applications import foods by it: `import { H_000001 } from
"@thereforejs/foods"`.

## Add a source

A source goes into `src/sources.ts` once, with its name, publisher, license (SPDX), URL and citation as
the publisher asks for it:

```ts
"cofid-2021": {
  name: "McCance and Widdowson's Composition of Foods Integrated Dataset (CoFID) 2021",
  publisher: "Public Health England",
  license: "OGL-UK-3.0",
  url: "https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid",
  citation: "...",
},
```

- **Only open licenses** that allow redistribution: today `CC0-1.0`, `CC-BY-4.0`, `OGL-UK-3.0`,
  `etalab-2.0` (`LICENSES` in [`scripts/check.ts`](./scripts/check.ts)). A source under another license
  needs a decision in an issue first.
- Link the page that states the license in the pull request.
- **A lab report** is a source too: register it with yourself or your lab as publisher and `CC0-1.0`
  if you release the values, the report number as `id`, and link or attach the report.

## Pull requests

- One food, one source or one kind of correction per pull request, so it can be reviewed value by
  value.
- `vp run generate`, `vp check` and `vp test` pass.
- Conventional commit, e.g. `fix(data): replace fat values of Kochbanane roh from CoFID`.
