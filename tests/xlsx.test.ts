import { strToU8, zipSync } from "fflate";
import { expect, test } from "vite-plus/test";
import { readSheet } from "../scripts/xlsx.ts";

// A minimal workbook shaped like BLS_4_0_Daten_2025_DE.xlsx: shared strings and plain number cells.
const workbook = (sheet: string, strings: string[]) => {
  const shared = strings.map((s) => `<si>${s}</si>`).join("");
  return zipSync({
    "xl/sharedStrings.xml": strToU8(`<?xml version="1.0"?><sst>${shared}</sst>`),
    "xl/worksheets/sheet1.xml": strToU8(
      `<?xml version="1.0"?><worksheet><sheetData>${sheet}</sheetData></worksheet>`,
    ),
  });
};

test("rows with shared strings and the raw text of number cells", () => {
  const book = workbook(
    `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" s="1" t="s"><v>1</v></c></row>` +
      `<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>9.3000000000000007</v></c></row>`,
    ["<t>BLS Code</t>", "<t>FAT Fett [g/100g]</t>", "<t>M5B1600</t>"],
  );
  expect(readSheet(book)).toEqual([
    ["BLS Code", "FAT Fett [g/100g]"],
    ["M5B1600", "9.3000000000000007"],
  ]);
});

test("XML entities and rich text in shared strings", () => {
  const book = workbook(
    `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>`,
    [
      "<t>&lt;LOD or &lt;LOQ</t>",
      `<t xml:space="preserve">Roquefort </t><r><t>mind. 50 % Fett i. Tr. &amp; &quot;x&quot;</t></r>`,
      "<t>Wei&#223;brot &#x2F; &apos;s</t>",
    ],
  );
  expect(readSheet(book)).toEqual([
    ["<LOD or <LOQ", 'Roquefort mind. 50 % Fett i. Tr. & "x"', "Weißbrot / 's"],
  ]);
});

test("cells sit at their column, gaps stay empty, columns past Z", () => {
  const book = workbook(
    `<row r="1"><c r="A1"><v>1</v></c><c r="C1"><v>3</v></c><c r="AA1"><v>27</v></c></row>`,
    [],
  );
  const [row] = readSheet(book);
  expect(row).toHaveLength(27);
  expect(row?.[0]).toBe("1");
  expect(row?.[1]).toBeUndefined();
  expect(row?.[2]).toBe("3");
  expect(row?.[26]).toBe("27");
});

test("a row is placed by its number, not by its order", () => {
  const book = workbook(`<row r="2"><c r="A2"><v>2</v></c></row>`, []);
  expect(readSheet(book)).toEqual([undefined, ["2"]]);
});

test("attributes in any order", () => {
  const book = workbook(
    `<row spans="1:2" r="1"><c s="1" t="s" r="B1"><v>0</v></c><c s="2" r="C1"/></row>`,
    ["<t>Fett</t>"],
  );
  expect(readSheet(book)).toEqual([[undefined, "Fett"]]);
});

test.each([
  ["a row without its number", `<row><c r="A1"><v>1</v></c></row>`],
  ["a cell without its reference", `<row r="1"><c><v>1</v></c></row>`],
  ["a formula", `<row r="1"><c r="A1"><f>1+1</f><v>2</v></c></row>`],
  ["an inline string", `<row r="1"><c r="A1" t="inlineStr"><is><t>x</t></is></c></row>`],
  ["a shared string that does not exist", `<row r="1"><c r="A1" t="s"><v>1</v></c></row>`],
])("%s is refused, never skipped", (_, sheet) => {
  expect(() => readSheet(workbook(sheet, ["<t>only</t>"]))).toThrow();
});

test("a missing sheet is refused by name", () => {
  const book = zipSync({ "xl/workbook.xml": strToU8("<workbook/>") });
  expect(() => readSheet(book)).toThrow(/xl\/worksheets\/sheet1\.xml/);
});

test("a malformed cell reference is refused", () => {
  expect(() => readSheet(workbook(`<row r="1"><c r="1A"><v>1</v></c></row>`, []))).toThrow(/1A/);
});
