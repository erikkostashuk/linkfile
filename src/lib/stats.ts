import type { ClickAggregate } from "./clicks";
import { destinationLabel } from "./config";
import type { LinkfileLink } from "./config";

export type StatsRow = {
  slug: string;
  title: string;
  emoji: string | undefined;
  url: string;

  destination: string;
  total: number;
  last7Days: number;
  last30Days: number;
  lastClickedAt: string | null;

  share: number;
};

export type StatsSummary = {
  rows: StatsRow[];
  totalClicks: number;
};

const EMPTY: ClickAggregate = {
  slug: "",
  total: 0,
  last7Days: 0,
  last30Days: 0,
  lastClickedAt: null,
};

export function buildStatsSummary(
  links: readonly LinkfileLink[],
  aggregates: readonly ClickAggregate[],
): StatsSummary {
  const bySlug = new Map(
    aggregates.map((aggregate) => [aggregate.slug, aggregate]),
  );
  const totalClicks = links.reduce(
    (sum, link) => sum + (bySlug.get(link.slug)?.total ?? 0),
    0,
  );

  const rows = links.map((link): StatsRow => {
    const aggregate = bySlug.get(link.slug) ?? EMPTY;

    return {
      slug: link.slug,
      title: link.title,
      emoji: link.emoji,
      url: link.url,
      destination: destinationLabel(link.url),
      total: aggregate.total,
      last7Days: aggregate.last7Days,
      last30Days: aggregate.last30Days,
      lastClickedAt: aggregate.lastClickedAt,
      share:
        totalClicks === 0
          ? 0
          : Math.round((aggregate.total / totalClicks) * 1000) / 10,
    };
  });

  rows.sort((a, b) => b.total - a.total || a.title.localeCompare(b.title));

  return { rows, totalClicks };
}

const TIMESTAMP_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatTimestamp(iso: string | null): string {
  if (iso === null) {
    return "Never";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return `${TIMESTAMP_FORMAT.format(date)} UTC`;
}
