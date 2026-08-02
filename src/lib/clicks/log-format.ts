import type { ClickEvent } from "./types";

/** Serialises one click as a single JSON line (JSON Lines / NDJSON). */
export function serializeClickEvent(event: ClickEvent): string {
  return `${JSON.stringify({ slug: event.slug, clickedAt: event.clickedAt })}\n`;
}

/**
 * Parses one line of the click log.
 *
 * Returns `null` for anything unusable — blank lines, half-written records from
 * an interrupted append, hand-edited JSON, or entries missing a valid timestamp.
 * Statistics must survive a slightly corrupt log rather than crash on it.
 */
export function parseClickLine(line: string): ClickEvent | null {
  const trimmed = line.trim();

  if (trimmed === "") {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const { slug, clickedAt } = parsed as Record<string, unknown>;

  if (typeof slug !== "string" || slug === "") {
    return null;
  }

  if (typeof clickedAt !== "string" || Number.isNaN(Date.parse(clickedAt))) {
    return null;
  }

  return { slug, clickedAt };
}
