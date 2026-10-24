import { describe, expect, test } from "vite-plus/test";
import { GROUPS, groupOf, isFoodId, nextId } from "../scripts/ids.ts";

describe("food ids", () => {
  test.each(["C131000", "M5B1600", "P7A4000", "H_000001", "C_123456"])("%s is valid", (id) => {
    expect(isFoodId(id)).toBe(true);
  });

  test.each([
    ["no group letter", "_000001"],
    ["lower case", "c131000"],
    ["a hyphen", "C-131000"],
    ["our id with five digits", "H_00001"],
    ["our id with letters", "H_00000A"],
    ["our id in an unknown group", "A_000001"],
    ["empty", ""],
  ])("%s is refused", (_, id) => {
    expect(isFoodId(id)).toBe(false);
  });

  test("the group is the first letter, for BLS codes and our ids alike", () => {
    expect(groupOf("C131000")).toBe("C");
    expect(groupOf("H_000001")).toBe("H");
  });

  // BLS 4.0 documentation 2.4 names only the principle; the 20 letters are those of the data.
  test("the groups are the 20 main groups of the BLS 4.0", () => {
    expect(Object.keys(GROUPS)).toEqual([
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "K",
      "M",
      "N",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
    ]);
  });
});

describe("the next id of a group", () => {
  test("starts at 1 and never reuses or fills a gap", () => {
    expect(nextId([], "H")).toBe("H_000001");
    expect(nextId(["H131000", "C_000004"], "H")).toBe("H_000001");
    expect(nextId(["H_000001", "H_000007", "H_000003"], "H")).toBe("H_000008");
  });

  test("an unknown group is refused", () => {
    expect(() => nextId([], "A")).toThrow(/A/);
  });
});
