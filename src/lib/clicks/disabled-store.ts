import type { ClickAggregate, ClickStore } from "./types";

/**
 * A store that accepts clicks and throws them away.
 *
 * Used on serverless platforms where no database is configured. Writing to the
 * local filesystem there would appear to work and then silently lose data on the
 * next cold start, so Linkfile refuses to pretend: redirects keep working, the
 * server logs a warning once, and /stats explains what to configure.
 */
export function createDisabledClickStore(reason: string): ClickStore {
  return {
    kind: "disabled",
    persistent: false,
    disabledReason: reason,

    async record(): Promise<void> {
      // Intentionally does nothing. Redirects must never depend on analytics.
    },

    async aggregate(): Promise<ClickAggregate[]> {
      return [];
    },
  };
}
