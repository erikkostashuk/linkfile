import type { ClickAggregate, ClickEvent } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function aggregateClicks(
  events: Iterable<ClickEvent>,
  now: Date = new Date(),
): ClickAggregate[] {
  const sevenDaysAgo = now.getTime() - 7 * DAY_MS;
  const thirtyDaysAgo = now.getTime() - 30 * DAY_MS;

  const rows = new Map<string, ClickAggregate>();

  for (const event of events) {
    const timestamp = Date.parse(event.clickedAt);

    if (Number.isNaN(timestamp)) {
      continue;
    }

    const row = rows.get(event.slug) ?? {
      slug: event.slug,
      total: 0,
      last7Days: 0,
      last30Days: 0,
      lastClickedAt: null,
    };

    row.total += 1;

    if (timestamp >= sevenDaysAgo) {
      row.last7Days += 1;
    }

    if (timestamp >= thirtyDaysAgo) {
      row.last30Days += 1;
    }

    if (
      row.lastClickedAt === null ||
      timestamp > Date.parse(row.lastClickedAt)
    ) {
      row.lastClickedAt = new Date(timestamp).toISOString();
    }

    rows.set(event.slug, row);
  }

  return [...rows.values()].sort(
    (a, b) => b.total - a.total || a.slug.localeCompare(b.slug),
  );
}
