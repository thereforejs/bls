import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";

const SHEET = "xl/worksheets/sheet1.xml";
const STRINGS = "xl/sharedStrings.xml";

/**
 * The first sheet of an XLSX as rows of raw cell text: a shared string resolved, a number cell as
 * written (`9.3000000000000007`). Rows and cells sit at their position; a gap stays `undefined`.
 * Only what the BLS file uses: shared strings and plain values, no formulas, no inline strings.
 */
export function readSheet(path: string): (string | undefined)[][] {
  const files = unzipSync(readFileSync(path), {
    filter: (file) => file.name === SHEET || file.name === STRINGS,
  });
  const sheet = files[SHEET];
  if (!sheet) throw new Error(`${path} has no ${SHEET}`);
  const strings = files[STRINGS] ? sharedStrings(strFromU8(files[STRINGS])) : [];

  const rows: (string | undefined)[][] = [];
  for (const [, number, cells = ""] of strFromU8(sheet).matchAll(
    /<row r="(\d+)"[^>]*?(?:\/>|>(.*?)<\/row>)/gs,
  )) {
    const row: (string | undefined)[] = [];
    for (const [, column = "", attributes = "", value] of cells.matchAll(
      /<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>(?:<v>(.*?)<\/v>)?<\/c>)/gs,
    )) {
      if (value === undefined) continue;
      row[columnIndex(column)] = attributes.includes('t="s"')
        ? strings[Number(value)]
        : unescapeXml(value);
    }
    rows[Number(number) - 1] = row;
  }
  return rows;
}

function sharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>(.*?)<\/si>/gs)].map(([, item = ""]) =>
    [...item.matchAll(/<t(?:\s[^>]*)?>(.*?)<\/t>/gs)]
      .map(([, text = ""]) => unescapeXml(text))
      .join(""),
  );
}

// A is 0, Z is 25, AA is 26.
function columnIndex(letters: string): number {
  let index = 0;
  for (let i = 0; i < letters.length; i++) index = index * 26 + letters.charCodeAt(i) - 64;
  return index - 1;
}

const ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

function unescapeXml(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, name: string) => {
    if (name.startsWith("#x")) return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    if (name.startsWith("#")) return String.fromCodePoint(Number(name.slice(1)));
    return ENTITIES[name] ?? entity;
  });
}
