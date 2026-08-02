import { Pool } from "pg";

import type { ClickAggregate, ClickEvent, ClickStore } from "./types";

const TABLE = "linkfile_clicks";

const CREATE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS ${TABLE} (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS ${TABLE}_slug_clicked_at_idx
    ON ${TABLE} (slug, clicked_at DESC);
`;

const AGGREGATE_SQL = `
  SELECT
    slug,
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE clicked_at >= $1)::bigint AS last_7_days,
    COUNT(*) FILTER (WHERE clicked_at >= $2)::bigint AS last_30_days,
    MAX(clicked_at) AS last_clicked_at
  FROM ${TABLE}
  GROUP BY slug
  ORDER BY total DESC, slug ASC
`;

type AggregateRow = {
  slug: string;
  total: string;
  last_7_days: string;
  last_30_days: string;
  last_clicked_at: Date | null;
};

type PostgresCache = {
  pools: Map<string, Pool>;
  schemaChecks: Map<string, Promise<void>>;
};

const globalCache = globalThis as typeof globalThis & {
  __linkfilePostgres?: PostgresCache;
};

function cache(): PostgresCache {
  globalCache.__linkfilePostgres ??= {
    pools: new Map(),
    schemaChecks: new Map(),
  };
  return globalCache.__linkfilePostgres;
}

function getPool(connectionString: string): Pool {
  const { pools } = cache();
  const existing = pools.get(connectionString);

  if (existing) {
    return existing;
  }

  const pool = new Pool({
    connectionString,

    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on("error", (error) => {
    console.error("[linkfile] PostgreSQL pool error:", error.message);
  });

  pools.set(connectionString, pool);
  return pool;
}

function ensureSchema(connectionString: string): Promise<void> {
  const { schemaChecks } = cache();
  const existing = schemaChecks.get(connectionString);

  if (existing) {
    return existing;
  }

  const check = getPool(connectionString)
    .query(CREATE_SCHEMA_SQL)
    .then(() => undefined)
    .catch((error: unknown) => {
      schemaChecks.delete(connectionString);
      throw error;
    });

  schemaChecks.set(connectionString, check);
  return check;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function createPostgresClickStore(connectionString: string): ClickStore {
  return {
    kind: "postgres",
    persistent: true,
    disabledReason: null,

    async record(event: ClickEvent): Promise<void> {
      await ensureSchema(connectionString);
      await getPool(connectionString).query(
        `INSERT INTO ${TABLE} (slug, clicked_at) VALUES ($1, $2)`,
        [event.slug, event.clickedAt],
      );
    },

    async aggregate(now: Date = new Date()): Promise<ClickAggregate[]> {
      await ensureSchema(connectionString);

      const { rows } = await getPool(connectionString).query<AggregateRow>(
        AGGREGATE_SQL,
        [
          new Date(now.getTime() - 7 * DAY_MS).toISOString(),
          new Date(now.getTime() - 30 * DAY_MS).toISOString(),
        ],
      );

      return rows.map((row) => ({
        slug: row.slug,
        total: Number(row.total),
        last7Days: Number(row.last_7_days),
        last30Days: Number(row.last_30_days),
        lastClickedAt: row.last_clicked_at
          ? row.last_clicked_at.toISOString()
          : null,
      }));
    },
  };
}
