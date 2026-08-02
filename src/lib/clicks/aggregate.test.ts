import { describe, expect, it } from "vitest";

import { aggregateClicks } from "./aggregate";
import type { ClickEvent } from "./types";

const NOW = new Date("2026-08-02T12:00:00.000Z");

function daysAgo(days: number, slug: string): ClickEvent {
  return {
    slug,
    clickedAt: new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
  };
}

describe("aggregateClicks", () => {
  it("returns no rows for no events", () => {
    expect(aggregateClicks([], NOW)).toEqual([]);
  });

  it("counts totals per slug", () => {
    const rows = aggregateClicks([daysAgo(1, "github"), daysAgo(2, "github"), daysAgo(1, "writing")], NOW);

    expect(rows).toEqual([
      { slug: "github", total: 2, last7Days: 2, last30Days: 2, lastClickedAt: daysAgo(1, "github").clickedAt },
      { slug: "writing", total: 1, last7Days: 1, last30Days: 1, lastClickedAt: daysAgo(1, "writing").clickedAt },
    ]);
  });

  it("windows the 7 and 30 day counts against the supplied clock", () => {
    const rows = aggregateClicks(
      [daysAgo(0, "github"), daysAgo(3, "github"), daysAgo(10, "github"), daysAgo(29, "github"), daysAgo(45, "github")],
      NOW,
    );

    expect(rows[0]).toMatchObject({ total: 5, last7Days: 2, last30Days: 4 });
  });

  it("treats the window boundary as inclusive", () => {
    const rows = aggregateClicks([daysAgo(7, "a"), daysAgo(30, "b")], NOW);

    expect(rows.find((row) => row.slug === "a")?.last7Days).toBe(1);
    expect(rows.find((row) => row.slug === "b")?.last30Days).toBe(1);
  });

  it("excludes events just outside the windows", () => {
    const justOverSeven = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000 - 1).toISOString();
    const justOverThirty = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000 - 1).toISOString();

    const rows = aggregateClicks(
      [
        { slug: "a", clickedAt: justOverSeven },
        { slug: "b", clickedAt: justOverThirty },
      ],
      NOW,
    );

    expect(rows.find((row) => row.slug === "a")).toMatchObject({ total: 1, last7Days: 0, last30Days: 1 });
    expect(rows.find((row) => row.slug === "b")).toMatchObject({ total: 1, last7Days: 0, last30Days: 0 });
  });

  it("keeps the most recent timestamp regardless of event order", () => {
    const rows = aggregateClicks([daysAgo(1, "github"), daysAgo(9, "github"), daysAgo(4, "github")], NOW);

    expect(rows[0]?.lastClickedAt).toBe(daysAgo(1, "github").clickedAt);
  });

  it("normalises timestamps to ISO UTC", () => {
    const rows = aggregateClicks([{ slug: "github", clickedAt: "2026-08-01T09:30:00+02:00" }], NOW);

    expect(rows[0]?.lastClickedAt).toBe("2026-08-01T07:30:00.000Z");
  });

  it("skips events with an unparseable timestamp", () => {
    const rows = aggregateClicks([{ slug: "github", clickedAt: "not-a-date" }, daysAgo(1, "github")], NOW);

    expect(rows[0]?.total).toBe(1);
  });

  it("sorts by total descending, then by slug", () => {
    const rows = aggregateClicks(
      [daysAgo(1, "zebra"), daysAgo(1, "zebra"), daysAgo(1, "beta"), daysAgo(1, "alpha")],
      NOW,
    );

    expect(rows.map((row) => row.slug)).toEqual(["zebra", "alpha", "beta"]);
  });

  it("defaults the clock to now when none is supplied", () => {
    const rows = aggregateClicks([{ slug: "github", clickedAt: new Date().toISOString() }]);

    expect(rows[0]).toMatchObject({ total: 1, last7Days: 1, last30Days: 1 });
  });
});
