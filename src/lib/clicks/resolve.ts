import { DEFAULT_CLICK_LOG_PATH } from "./file-store";
import { ClickStoreConfigError } from "./types";

export const CLICK_STORE_MODES = ["auto", "file", "postgres"] as const;
export type ClickStoreMode = (typeof CLICK_STORE_MODES)[number];

export type ClickStoreEnv = {
  CLICK_STORE?: string | undefined;
  CLICK_LOG_PATH?: string | undefined;
  DATABASE_URL?: string | undefined;
  VERCEL?: string | undefined;
  VERCEL_ENV?: string | undefined;
};

export type ClickStoreResolution =
  | { kind: "file"; mode: ClickStoreMode; logPath: string }
  | { kind: "postgres"; mode: ClickStoreMode; connectionString: string }
  | { kind: "disabled"; mode: ClickStoreMode; reason: string };

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === "" ? undefined : trimmed;
}

function isServerless(env: ClickStoreEnv): boolean {
  return env.VERCEL === "1" || clean(env.VERCEL_ENV) !== undefined;
}

export function resolveClickStore(env: ClickStoreEnv): ClickStoreResolution {
  const requested = clean(env.CLICK_STORE)?.toLowerCase() ?? "auto";

  if (!(CLICK_STORE_MODES as readonly string[]).includes(requested)) {
    throw new ClickStoreConfigError(
      `CLICK_STORE="${requested}" is not valid. Use one of: ${CLICK_STORE_MODES.join(", ")}.`,
    );
  }

  const mode = requested as ClickStoreMode;
  const connectionString = clean(env.DATABASE_URL);
  const logPath = clean(env.CLICK_LOG_PATH) ?? DEFAULT_CLICK_LOG_PATH;

  if (mode === "postgres") {
    if (!connectionString) {
      throw new ClickStoreConfigError(
        "CLICK_STORE=postgres requires DATABASE_URL. Set a PostgreSQL connection string, or use CLICK_STORE=file to record clicks to a local log.",
      );
    }

    return { kind: "postgres", mode, connectionString };
  }

  if (mode === "file") {
    return { kind: "file", mode, logPath };
  }

  if (connectionString) {
    return { kind: "postgres", mode, connectionString };
  }

  if (isServerless(env)) {
    return {
      kind: "disabled",
      mode,
      reason:
        "Running on a serverless host without DATABASE_URL. Click recording is disabled because a local log file is not durable there. Set DATABASE_URL and CLICK_STORE=postgres to record clicks.",
    };
  }

  return { kind: "file", mode, logPath };
}
