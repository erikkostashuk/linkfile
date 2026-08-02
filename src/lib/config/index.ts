import rawConfig from "~/links.json";

import { DEFAULT_ACCENT, readableForeground } from "../color";
import { parseConfig } from "./parse";
import type { LinkfileConfig, LinkfileLink } from "./schema";

export { LinkfileConfigError } from "./parse";
export type { LinkfileConfig, LinkfileLink, LinkfileProfile } from "./schema";

export const config: LinkfileConfig = parseConfig(rawConfig);

const linksBySlug = new Map(config.links.map((link) => [link.slug, link]));

export function findLink(slug: string): LinkfileLink | undefined {
  return linksBySlug.get(slug);
}

export const accent = config.profile.accent ?? DEFAULT_ACCENT;

export const accentForeground = readableForeground(accent);

export function destinationLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "mailto:" ? parsed.pathname : parsed.hostname;
  } catch {
    return url;
  }
}
