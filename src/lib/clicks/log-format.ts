import type { ClickEvent } from "./types";

export function serializeClickEvent(event: ClickEvent): string {
  return `${JSON.stringify({ slug: event.slug, clickedAt: event.clickedAt })}\n`;
}

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
