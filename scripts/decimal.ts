import { decimal, fromNumber, multiply, toDecimalString } from "@thereforejs/decy";

const NUMBER = /^-?\d+(\.\d+)?(E[+-]?\d+)?$/i;

/**
 * The shortest plain decimal that reads back to the same double as the source cell:
 * `9.3000000000000007` is `9.3`, `1.4999999999999999E-2` is `0.015`. Never `toFixed`, never an
 * exponent.
 */
export function shortestDecimal(raw: string): string {
  const value = Number(raw);
  // Number("") and Number(" ") are 0, so is "1E-400": text must never become a value.
  const underflow = value === 0 && /[1-9]/.test(raw.replace(/E.*$/i, ""));
  if (!NUMBER.test(raw) || !Number.isFinite(value) || underflow) {
    throw new Error(`${JSON.stringify(raw)} is not a number`);
  }
  return toDecimalString(fromNumber(value));
}

/** A shortest decimal in milligrams as grams, exact: a shift by three places, never a division. */
export function gramsFromMilligrams(mg: string): string {
  // The product keeps at least 3 decimals ("0.250", "10.000"); only zeros behind the point go.
  return toDecimalString(multiply(decimal(mg), decimal("0.001"))).replace(/\.?0+$/, "");
}
