import { describe, expect, it } from "vitest";

import { contrastRatio, hexToRgb, readableForeground, relativeLuminance } from "./color";
import { initials } from "./initials";
import { DEFAULT_SITE_URL, normalizeSiteUrl } from "./site";

describe("hexToRgb", () => {
  it.each([
    ["#000000", { r: 0, g: 0, b: 0 }],
    ["#ffffff", { r: 255, g: 255, b: 255 }],
    ["#7c3aed", { r: 124, g: 58, b: 237 }],
    ["#FFF", { r: 255, g: 255, b: 255 }],
    ["#7c3aedcc", { r: 124, g: 58, b: 237 }],
    ["7c3aed", { r: 124, g: 58, b: 237 }],
  ])("parses %j", (hex, expected) => {
    expect(hexToRgb(hex)).toEqual(expected);
  });

  it.each(["", "#12345", "purple", "#gggggg"])("returns null for %j", (hex) => {
    expect(hexToRgb(hex)).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("puts black at 0 and white at 1", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("reports the maximum 21:1 for black on white", () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 5);
  });

  it("is symmetric", () => {
    const a = { r: 124, g: 58, b: 237 };
    const b = { r: 255, g: 255, b: 255 };

    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});

describe("readableForeground", () => {
  it.each([
    ["#7c3aed", "#ffffff"],
    ["#000000", "#ffffff"],
    ["#0f172a", "#ffffff"],
    ["#ffffff", "#101014"],
    ["#fde047", "#101014"],
    ["#22d3ee", "#101014"],
  ])("puts %j text on %j", (accent, expected) => {
    expect(readableForeground(accent)).toBe(expected);
  });

  it("always reaches at least 4.5:1 against the accent it was chosen for", () => {
    for (const accent of ["#7c3aed", "#fde047", "#22d3ee", "#dc2626", "#065f46", "#e2e8f0"]) {
      const accentRgb = hexToRgb(accent)!;
      const foregroundRgb = hexToRgb(readableForeground(accent))!;

      expect(contrastRatio(accentRgb, foregroundRgb)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("falls back to white for an unparseable accent", () => {
    expect(readableForeground("not-a-colour")).toBe("#ffffff");
  });
});

describe("initials", () => {
  it.each([
    ["Alex Rivera", "AR"],
    ["Alex", "A"],
    ["alex rivera moreno", "AR"],
    ["  spaced   out  ", "SO"],
    ["Ada", "A"],
    ["김민준 이", "김이"],
  ])("builds a monogram from %j", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it.each(["", "   ", "!!!"])("falls back to L for %j", (name) => {
    expect(initials(name)).toBe("L");
  });
});

describe("normalizeSiteUrl", () => {
  it.each([
    ["https://links.example.com", "https://links.example.com"],
    ["https://links.example.com/", "https://links.example.com"],
    ["https://links.example.com///", "https://links.example.com"],
    ["  http://localhost:3000  ", "http://localhost:3000"],
    ["https://example.com/profile/", "https://example.com/profile"],
  ])("normalises %j to %j", (input, expected) => {
    expect(normalizeSiteUrl(input)).toBe(expected);
  });

  it.each([undefined, "", "   ", "not a url"])("falls back to localhost for %j", (input) => {
    expect(normalizeSiteUrl(input)).toBe(DEFAULT_SITE_URL);
  });
});
