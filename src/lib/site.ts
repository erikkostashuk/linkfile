/** Fallback used when `NEXT_PUBLIC_SITE_URL` is not set. */
export const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * Normalises a configured origin: trims whitespace and removes any trailing
 * slash so `${siteUrl}/stats` never produces a double slash.
 *
 * Falls back to localhost for missing or unparseable input rather than throwing,
 * because a bad canonical URL should not take a profile page offline.
 */
export function normalizeSiteUrl(value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_SITE_URL;
  }

  try {
    const url = new URL(trimmed);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Canonical public origin of this deployment, without a trailing slash. */
export const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** Repository URL, shown in the footer and used for "Built with Linkfile". */
export const REPOSITORY_URL = "https://github.com/erikkostashuk/linkfile";
