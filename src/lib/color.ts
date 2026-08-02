/** Accent used when `profile.accent` is omitted from links.json. */
export const DEFAULT_ACCENT = "#7c3aed";

export type Rgb = { r: number; g: number; b: number };

/**
 * Expands any accepted hex form (`#rgb`, `#rrggbb`, `#rrggbbaa`) into 0-255
 * channels. Alpha is ignored: it never affects text contrast decisions.
 *
 * Returns `null` for input the schema would already have rejected, so callers
 * can fall back instead of rendering a broken page.
 */
export function hexToRgb(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, "");

  const expanded =
    value.length === 3
      ? value
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : value.length === 8
        ? value.slice(0, 6)
        : value;

  if (expanded.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return null;
  }

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (raw: number) => {
    const srgb = raw / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 contrast ratio between two colours, 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));

  return (lighter + 0.05) / (darker + 0.05);
}

const NEAR_WHITE: Rgb = { r: 255, g: 255, b: 255 };
const NEAR_BLACK: Rgb = { r: 16, g: 16, b: 20 };

/**
 * Picks the text colour to place *on top of* the accent, whichever of near-white
 * or near-black has the higher contrast ratio. This is what keeps a pale accent
 * such as `#fde047` from producing unreadable white-on-yellow.
 */
export function readableForeground(accent: string): string {
  const rgb = hexToRgb(accent);

  if (!rgb) {
    return "#ffffff";
  }

  return contrastRatio(rgb, NEAR_WHITE) >= contrastRatio(rgb, NEAR_BLACK) ? "#ffffff" : "#101014";
}
