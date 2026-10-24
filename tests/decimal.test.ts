import fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { shortestDecimal } from "../scripts/decimal.ts";

describe("shortest decimal of a source cell", () => {
  // Artefacts as they appear in BLS_4_0_Daten_2025_DE.xlsx (SPEC 4).
  test.each([
    ["9.3000000000000007", "9.3"],
    ["1.3420000000000001", "1.342"],
    ["1.4999999999999999E-2", "0.015"],
    ["2.7E-2", "0.027"],
    ["0", "0"],
    ["100", "100"],
    ["0.5", "0.5"],
  ])("%s reads %s", (raw, expected) => {
    expect(shortestDecimal(raw)).toBe(expected);
  });

  // JavaScript writes these with an exponent; the data ships plain decimals only.
  test.each([
    ["1E-7", "0.0000001"],
    ["1.5E-7", "0.00000015"],
    ["1.2345E-10", "0.00000000012345"],
    ["1E21", "1000000000000000000000"],
    ["1.5E22", "15000000000000000000000"],
  ])("%s reads %s, no exponent", (raw, expected) => {
    expect(shortestDecimal(raw)).toBe(expected);
  });

  test.each(["", " ", "-", "TR", "<LOD", "1,5", "NaN", "Infinity", "2E308"])(
    "%j is no number and is refused",
    (raw) => {
      expect(() => shortestDecimal(raw)).toThrow(/not a number/);
    },
  );

  test("more than 30 decimals is refused, not rounded", () => {
    expect(shortestDecimal("1E-30")).toBe(`0.${"0".repeat(29)}1`);
    expect(() => shortestDecimal("1E-31")).toThrow(/30/);
  });

  test("every value reads back to the same double, as a plain decimal", () => {
    fc.assert(
      fc.property(
        // decy holds at most 30 decimals (the BLS uses 18); the top stays clear of overflow.
        fc.oneof(fc.constant(0), fc.double({ min: 1e-12, max: 1e300, noNaN: true })),
        fc.integer({ min: 1, max: 17 }),
        (value, digits) => {
          // The XLSX writes up to 17 significant digits, sometimes with an exponent.
          const raw = value.toPrecision(digits);
          const shipped = shortestDecimal(raw);
          expect(shipped).toMatch(/^(0|[1-9]\d*)(\.\d*[1-9])?$/);
          expect(Number(shipped)).toBe(Number(raw));
        },
      ),
    );
  });
});
