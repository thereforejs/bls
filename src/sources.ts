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
} satisfies Record<string, Source>;
