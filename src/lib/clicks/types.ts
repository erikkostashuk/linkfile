/** Which backend is recording clicks. */
export type ClickStoreKind = "file" | "postgres" | "disabled";

/**
 * The complete set of data Linkfile records for a click.
 *
 * There is deliberately nothing else here: no IP address, user agent, referrer,
 * cookie, session or device fingerprint. Adding a field to this type is the only
 * way to start collecting more, which makes the privacy promise reviewable.
 */
export type ClickEvent = {
  /** Slug of a link that exists in links.json. */
  slug: string;
  /** ISO 8601 timestamp in UTC. */
  clickedAt: string;
};

/** Per-slug rollup used by the stats page. */
export type ClickAggregate = {
  slug: string;
  total: number;
  last7Days: number;
  last30Days: number;
  /** ISO 8601 timestamp of the most recent click, or null when never clicked. */
  lastClickedAt: string | null;
};

/**
 * The storage seam. Routes and pages only ever talk to this interface, so a new
 * backend means one new file and one line in `resolveClickStore`.
 */
export interface ClickStore {
  readonly kind: ClickStoreKind;
  /** False when clicks are accepted but not durably stored. */
  readonly persistent: boolean;
  /** Why recording is unavailable, when `persistent` is false. Otherwise null. */
  readonly disabledReason: string | null;
  /** Records a single click. Rejects on failure; callers decide how to cope. */
  record(event: ClickEvent): Promise<void>;
  /** Returns one row per slug that has at least one recorded click. */
  aggregate(now?: Date): Promise<ClickAggregate[]>;
}

/** Thrown when environment variables describe an impossible storage setup. */
export class ClickStoreConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClickStoreConfigError";
  }
}
