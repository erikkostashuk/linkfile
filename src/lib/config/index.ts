import rawConfig from "~/links.json";

import { DEFAULT_ACCENT, readableForeground } from "../color";
import { parseConfig } from "./parse";
import type { LinkfileConfig, LinkfileLink } from "./schema";

export { LinkfileConfigError } from "./parse";
export type { LinkfileConfig, LinkfileLink, LinkfileProfile } from "./schema";

/**
 * The validated configuration for this deployment.
 *
 * `links.json` is imported (not read from disk) so it is bundled into the build:
 * the same object works on a VPS, in Docker and on serverless hosts, and an
 * invalid file fails the build instead of the first request.
 */
export const config: LinkfileConfig = parseConfig(rawConfig);

const linksBySlug = new Map(config.links.map((link) => [link.slug, link]));

/**
 * Resolves a slug against the trusted configuration.
 *
 * This is the only way a destination URL is ever produced — nothing from the
 * request is used to build a redirect target.
 */
export function findLink(slug: string): LinkfileLink | undefined {
  return linksBySlug.get(slug);
}

/** Accent colour, with the documented fallback applied. */
export const accent = config.profile.accent ?? DEFAULT_ACCENT;

/** Readable text colour for content placed on top of the accent. */
export const accentForeground = readableForeground(accent);

/** Hostname shown in the stats table, or the scheme for non-http destinations. */
export function destinationLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "mailto:" ? parsed.pathname : parsed.hostname;
  } catch {
    return url;
  }
}
