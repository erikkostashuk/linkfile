import { describe, expect, it } from "vitest";

import type { ClickAggregate } from "./clicks";
import type { LinkfileLink } from "./config";
import { buildStatsSummary, formatTimestamp } from "./stats";

const links: LinkfileLink[] = [
  { slug: "projects", title: "See what I'm building", url: "https://example.com/projects", emoji: "🚀" },
  { slug: "github", title: "GitHub", url: "https://github.com/example" },
  { slug: "contact", title: "Send me an email", url: "mailto:hello@example.com" },
];

function aggregate(slug: string, total: number, overrides: Partial<ClickAggregate> = {}): ClickAggregate {
  return {
    slug,
    total,
    last7Days: total,
    last30Days: total,
    lastClickedAt: "2026-08-02T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildStatsSummary", () => {
  it("sums every link into the overall total", () => {
    const { totalClicks } = buildStatsSummary(links, [aggregate("projects", 30), aggregate("github", 10)]);

    expect(totalClicks).toBe(40);
  });

  it("includes links with no recorded clicks so the full list is visible", () => {
    const { rows } = buildStatsSummary(links, [aggregate("projects", 5)]);

    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.slug === "contact")).toMatchObject({
      total: 0,
      last7Days: 0,
      last30Days: 0,
      lastClickedAt: null,
      share: 0,
    });
  });

  it("sorts by total clicks descending, then by title", () => {
    const { rows } = buildStatsSummary(links, [aggregate("github", 7), aggregate("projects", 7)]);

    expect(rows.map((row) => row.slug)).toEqual(["github", "projects", "contact"]);
  });

  it("computes each link's share of the total to one decimal place", () => {
    const { rows } = buildStatsSummary(links, [aggregate("projects", 1), aggregate("github", 2)]);

    expect(rows.map((row) => row.share)).toEqual([66.7, 33.3, 0]);
  });

  it("reports zero shares rather than dividing by zero when nothing is recorded", () => {
    const { rows, totalClicks } = buildStatsSummary(links, []);

    expect(totalClicks).toBe(0);
    expect(rows.every((row) => row.share === 0 && row.total === 0)).toBe(true);
  });

  it("carries the 7 and 30 day windows through unchanged", () => {
    const { rows } = buildStatsSummary(links, [aggregate("projects", 40, { last7Days: 4, last30Days: 22 })]);

    expect(rows[0]).toMatchObject({ total: 40, last7Days: 4, last30Days: 22 });
  });

  it("shows the hostname for web links and the address for mailto links", () => {
    const { rows } = buildStatsSummary(links, []);
    const bySlug = new Map(rows.map((row) => [row.slug, row]));

    expect(bySlug.get("projects")?.destination).toBe("example.com");
    expect(bySlug.get("github")?.destination).toBe("github.com");
    expect(bySlug.get("contact")?.destination).toBe("hello@example.com");
  });

  it("ignores click data for slugs that are no longer configured", () => {
    const { rows, totalClicks } = buildStatsSummary(links, [aggregate("projects", 3), aggregate("deleted-link", 99)]);

    expect(totalClicks).toBe(3);
    expect(rows.map((row) => row.slug)).not.toContain("deleted-link");
  });

  it("handles an empty link list", () => {
    expect(buildStatsSummary([], [])).toEqual({ rows: [], totalClicks: 0 });
  });
});

describe("formatTimestamp", () => {
  it("renders a timestamp in UTC", () => {
    expect(formatTimestamp("2026-08-02T21:05:00.000Z")).toBe("2 Aug 2026, 21:05 UTC");
  });

  it("converts an offset timestamp to UTC", () => {
    expect(formatTimestamp("2026-08-02T23:05:00+02:00")).toBe("2 Aug 2026, 21:05 UTC");
  });

  it('renders "Never" when a link has never been clicked', () => {
    expect(formatTimestamp(null)).toBe("Never");
  });

  it("degrades gracefully for an unparseable value", () => {
    expect(formatTimestamp("not-a-date")).toBe("Unknown");
  });
});
