import { createDisabledClickStore } from "./disabled-store";
import { createFileClickStore } from "./file-store";
import { resolveClickStore, type ClickStoreEnv } from "./resolve";
import type { ClickStore } from "./types";

export { aggregateClicks } from "./aggregate";
export { resolveClickStore, CLICK_STORE_MODES } from "./resolve";
export type { ClickStoreEnv, ClickStoreMode, ClickStoreResolution } from "./resolve";
export { ClickStoreConfigError } from "./types";
export type { ClickAggregate, ClickEvent, ClickStore, ClickStoreKind } from "./types";

const warned = new Set<string>();

function warnOnce(message: string): void {
  if (warned.has(message)) {
    return;
  }

  warned.add(message);
  console.warn(`[linkfile] ${message}`);
}

/**
 * Builds the click store described by the environment.
 *
 * Async because the PostgreSQL driver is imported lazily: file-store and
 * serverless-disabled deployments never load `pg` at all, which keeps cold
 * starts and self-hosted bundles smaller.
 *
 * Stores are cheap, stateless handles (connection pools live in their own
 * module-level cache), so this is called per request rather than memoised —
 * which also means a changed environment takes effect without a restart.
 */
export async function getClickStore(env?: ClickStoreEnv): Promise<ClickStore> {
  // Each variable is read by name rather than passing `process.env` wholesale,
  // which is what lets bundlers inline the values correctly.
  const resolution = resolveClickStore(
    env ?? {
      CLICK_STORE: process.env.CLICK_STORE,
      CLICK_LOG_PATH: process.env.CLICK_LOG_PATH,
      DATABASE_URL: process.env.DATABASE_URL,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
  );

  if (resolution.kind === "postgres") {
    const { createPostgresClickStore } = await import("./postgres-store");
    return createPostgresClickStore(resolution.connectionString);
  }

  if (resolution.kind === "disabled") {
    warnOnce(resolution.reason);
    return createDisabledClickStore(resolution.reason);
  }

  return createFileClickStore(resolution.logPath);
}
