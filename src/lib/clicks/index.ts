import { createDisabledClickStore } from "./disabled-store";
import { createFileClickStore } from "./file-store";
import { resolveClickStore, type ClickStoreEnv } from "./resolve";
import type { ClickStore } from "./types";

export { aggregateClicks } from "./aggregate";
export { resolveClickStore, CLICK_STORE_MODES } from "./resolve";
export type {
  ClickStoreEnv,
  ClickStoreMode,
  ClickStoreResolution,
} from "./resolve";
export { ClickStoreConfigError } from "./types";
export type {
  ClickAggregate,
  ClickEvent,
  ClickStore,
  ClickStoreKind,
} from "./types";

const warned = new Set<string>();

function warnOnce(message: string): void {
  if (warned.has(message)) {
    return;
  }

  warned.add(message);
  console.warn(`[linkfile] ${message}`);
}

export async function getClickStore(env?: ClickStoreEnv): Promise<ClickStore> {
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
