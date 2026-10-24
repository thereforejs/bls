/** A source that values in `data/foods/` may come from. Only openly licensed sources are listed. */
export type Source = {
  name: string;
  publisher: string;
  /** SPDX identifier. */
  license: string;
  url: string;
  /** As the publisher asks to be cited. */
  citation: string;
};

export const sources = {
  "bls-4.0": {
    name: "Bundeslebensmittelschlüssel (BLS), Version 4.0",
    publisher: "Max Rubner-Institut",
    license: "CC-BY-4.0",
    url: "https://www.blsdb.de",
    citation:
      "Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank. Karlsruhe. DOI: 10.25826/Data20251217-134202-0",
  },
  "cofid-2021": {
    name: "McCance and Widdowson's Composition of Foods Integrated Dataset (CoFID) 2021",
    publisher: "Public Health England",
    license: "OGL-UK-3.0",
    url: "https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid",
    citation:
      "Public Health England (2021): McCance and Widdowson's The Composition of Foods Integrated Dataset 2021. Contains public sector information licensed under the Open Government Licence v3.0.",
  },
  "usda-sr-legacy": {
    name: "USDA FoodData Central, SR Legacy (2018)",
    publisher: "U.S. Department of Agriculture, Agricultural Research Service",
    license: "CC0-1.0",
    url: "https://fdc.nal.usda.gov",
    citation:
      "U.S. Department of Agriculture, Agricultural Research Service (2019): FoodData Central, SR Legacy. fdc.nal.usda.gov.",
  },
  "usda-fndds-2024": {
    name: "USDA FoodData Central, Survey Foods (FNDDS), release 2024-10-31",
    publisher: "U.S. Department of Agriculture, Agricultural Research Service",
    license: "CC0-1.0",
    url: "https://fdc.nal.usda.gov",
    citation:
      "U.S. Department of Agriculture, Agricultural Research Service (2024): FoodData Central, Survey Foods (FNDDS). fdc.nal.usda.gov.",
  },
} satisfies Record<string, Source>;
