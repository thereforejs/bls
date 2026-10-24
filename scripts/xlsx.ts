import { strFromU8, unzipSync } from "fflate";

const SHEET = "xl/worksheets/sheet1.xml";
const STRINGS = "xl/sharedStrings.xml";

/**
 * The first sheet of an XLSX as rows of raw cell text: a shared string resolved, a number cell as
 * written (`9.3000000000000007`). Rows and cells sit at their position; a gap stays `undefined`.
 * Only what the BLS file uses: shared strings and plain values, no formulas, no inline strings.
 */
export function readSheet(xlsx: Uint8Array): (string | undefined)[][] {
  const files = unzipSync(xlsx, {
    filter: (file) => file.name === SHEET || file.name === STRINGS,
  });
  const sheet = files[SHEET];
  if (!sheet) throw new Error(`The workbook has no ${SHEET}`);
  const strings = files[STRINGS] ? sharedStrings(strFromU8(files[STRINGS])) : [];

  const rows: (string | undefined)[][] = [];
  for (const [element, attributes = "", cells = ""] of strFromU8(sheet).matchAll(
    /<row\b([^>]*?)(?:\/>|>(.*?)<\/row>)/gs,
  )) {
    const number = reference(/\sr="(\d+)"/.exec(attributes), element);
    const row: (string | undefined)[] = [];
    for (const [cell, cellAttributes = "", content = ""] of cells.matchAll(
      /<c\b([^>]*?)(?:\/>|>(.*?)<\/c>)/gs,
    )) {
      const column = reference(/\sr="([A-Z]+)\d+"/.exec(cellAttributes), cell);
      if (content === "") continue;
      const value = /^<v>(.*)<\/v>$/s.exec(content)?.[1];
      if (value === undefined) throw new Error(`Unsupported cell: ${cell}`);
      row[columnIndex(column)] = /\st="s"/.test(cellAttributes)
        ? sharedString(strings, value, cell)
        : unescapeXml(value);
    }
    rows[Number(number) - 1] = row;
  }
  return rows;
}

function reference(match: RegExpExecArray | null, element: string): string {
  const value = match?.[1];
  if (value === undefined) throw new Error(`No valid r attribute in ${element}`);
  return value;
}

function sharedString(strings: string[], index: string, cell: string): string {
  const text = strings[Number(index)];
  if (text === undefined) throw new Error(`No shared string ${index} for ${cell}`);
  return text;
}

function sharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>(.*?)<\/si>/gs)].map(([, item = ""]) =>
    [...item.matchAll(/<t(?:\s[^>]*)?>(.*?)<\/t>/gs)]
      .map(([, text = ""]) => unescapeXml(text))
      .join(""),
  );
}

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
