import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LinkfileMark } from "@/components/icons";
import { authorizeStatsRequest } from "@/lib/auth";
import { getClickStore } from "@/lib/clicks";
import { config } from "@/lib/config";
import { buildStatsSummary, formatTimestamp } from "@/lib/stats";

import styles from "./stats.module.css";

export const runtime = "nodejs";

// Never cached or prerendered: the response is credential-gated and changes on
// every click.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Statistics — Linkfile",
  robots: { index: false, follow: false, nocache: true },
};

const numberFormat = new Intl.NumberFormat("en-US");

export default async function StatsPage() {
  // Second, independent authorisation check. src/proxy.ts already rejected
  // unauthenticated requests; repeating it here means statistics are never
  // rendered by a request that skipped the proxy layer.
  const requestHeaders = await headers();
  const auth = authorizeStatsRequest(requestHeaders.get("authorization"), {
    STATS_USERNAME: process.env.STATS_USERNAME,
    STATS_PASSWORD: process.env.STATS_PASSWORD,
  });

  if (auth.status !== "authorized") {
    notFound();
  }

  const store = await getClickStore();
  const aggregates = await store.aggregate();
  const { rows, totalClicks } = buildStatsSummary(config.links, aggregates);
  const busiest = rows[0]?.total ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            <LinkfileMark className={styles.eyebrowMark} />
            Linkfile statistics
          </p>
          <h1 className={styles.title}>{config.profile.name}</h1>
          <p className={styles.summary}>
            <strong className={styles.summaryTotal}>{numberFormat.format(totalClicks)}</strong>{" "}
            {totalClicks === 1 ? "click" : "clicks"} recorded across {rows.length}{" "}
            {rows.length === 1 ? "link" : "links"}.
          </p>
        </header>

        {!store.persistent ? (
          <div className={styles.notice} role="status">
            <strong>Click recording is turned off.</strong>
            <span>{store.disabledReason}</span>
          </div>
        ) : null}

        {totalClicks === 0 && store.persistent ? (
          <div className={styles.notice} role="status">
            <strong>No clicks yet.</strong>
            <span>
              Every link below is live at <code>/go/&lt;slug&gt;</code>. Totals appear here as soon as someone follows
              one.
            </span>
          </div>
        ) : null}

        <ol className={styles.rows}>
          {rows.map((row, index) => (
            <li key={row.slug} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.rank} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className={styles.rowIdentity}>
                  <h2 className={styles.rowTitle}>
                    {row.emoji ? <span aria-hidden="true">{row.emoji} </span> : null}
                    {row.title}
                  </h2>
                  <p className={styles.rowMeta}>
                    <code className={styles.slug}>/go/{row.slug}</code>
                    {/* Arrow and destination share one element so a narrow
                        screen can never wrap them apart. */}
                    <span className={styles.destination}>
                      <span aria-hidden="true">&rarr;&nbsp;</span>
                      {row.destination}
                    </span>
                  </p>
                </div>
                <div className={styles.rowTotal}>
                  <span className={styles.rowTotalValue}>{numberFormat.format(row.total)}</span>
                  <span className={styles.rowTotalLabel}>{row.share}%</span>
                </div>
              </div>

              {/*
                CSS-only relative bar. Width is a share of the busiest link so
                differences stay visible; the accessible value lives in the
                aria-label rather than in the decorative element.
              */}
              <div
                className={styles.bar}
                role="img"
                aria-label={`${row.total} of ${totalClicks} total clicks (${row.share}%)`}
              >
                <span
                  className={styles.barFill}
                  style={{ width: `${busiest === 0 ? 0 : (row.total / busiest) * 100}%` }}
                />
              </div>

              <dl className={styles.metrics}>
                <div className={styles.metric}>
                  <dt>Last 7 days</dt>
                  <dd>{numberFormat.format(row.last7Days)}</dd>
                </div>
                <div className={styles.metric}>
                  <dt>Last 30 days</dt>
                  <dd>{numberFormat.format(row.last30Days)}</dd>
                </div>
                <div className={styles.metric}>
                  <dt>Most recent</dt>
                  <dd>{formatTimestamp(row.lastClickedAt)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>

        <footer className={styles.footer}>
          <span>
            Storage: <code>{store.kind}</code>
          </span>
          <span>Only the link slug and a UTC timestamp are ever recorded.</span>
        </footer>
      </div>
    </div>
  );
}
