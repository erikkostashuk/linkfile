/**
 * HTTP Basic Authentication for /stats.
 *
 * Written against Web APIs only (`atob`, `TextDecoder`) so the exact same code
 * runs in proxy middleware and in the Node.js page render — the stats route is
 * checked twice, and both checks share one tested implementation.
 *
 * `STATS_USERNAME` / `STATS_PASSWORD` have no `NEXT_PUBLIC_` prefix, so Next.js
 * never inlines them into a browser bundle. There are no client components in
 * this project, so these values cannot reach the browser at all.
 */

export type BasicCredentials = {
  username: string;
  password: string;
};

/** Sent with every 401 so browsers show a login prompt. */
export const WWW_AUTHENTICATE = 'Basic realm="Linkfile statistics", charset="UTF-8"';

/**
 * Compares two strings without an early exit on the first differing byte.
 *
 * Length differences are still observable, which is acceptable here: the guarded
 * secret is an operator-chosen password, not a per-request token.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);

  let difference = left.length ^ right.length;

  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return difference === 0;
}

/**
 * Parses an `Authorization: Basic <base64>` header.
 *
 * Returns `null` for anything that is not a well-formed Basic credential: a
 * missing header, a different scheme, invalid base64, or a payload with no
 * colon separator. Passwords may contain colons; usernames may not, per RFC 7617.
 */
export function parseBasicAuthHeader(header: string | null | undefined): BasicCredentials | null {
  if (typeof header !== "string") {
    return null;
  }

  const match = /^Basic +([A-Za-z0-9+/=]+)$/i.exec(header.trim());

  if (!match?.[1]) {
    return null;
  }

  let decoded: string;

  try {
    const binary = atob(match[1]);
    decoded = new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch {
    return null;
  }

  const separator = decoded.indexOf(":");

  if (separator === -1) {
    return null;
  }

  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

export type StatsAuthEnv = {
  STATS_USERNAME?: string | undefined;
  STATS_PASSWORD?: string | undefined;
};

/**
 * Reads the configured credentials.
 *
 * Returns `null` unless *both* variables are set to a non-empty value. There is
 * deliberately no default: an unconfigured deployment must never end up with a
 * publicly readable statistics page.
 */
export function getStatsCredentials(env: StatsAuthEnv): BasicCredentials | null {
  const username = env.STATS_USERNAME?.trim();
  const password = env.STATS_PASSWORD ?? "";

  if (!username || password === "") {
    return null;
  }

  return { username, password };
}

export type AuthResult =
  /** Credentials are configured and the request presented them. */
  | { status: "authorized" }
  /** Credentials are configured but the request did not match. Challenge with 401. */
  | { status: "unauthorized" }
  /** No credentials configured. /stats stays hidden entirely. */
  | { status: "not-configured" };

/** Authorises one request against the environment. */
export function authorizeStatsRequest(authorizationHeader: string | null | undefined, env: StatsAuthEnv): AuthResult {
  const expected = getStatsCredentials(env);

  if (!expected) {
    return { status: "not-configured" };
  }

  const provided = parseBasicAuthHeader(authorizationHeader);

  if (!provided) {
    return { status: "unauthorized" };
  }

  // Both comparisons always run so a correct username cannot be detected by
  // response time alone.
  const usernameMatches = timingSafeEqual(provided.username, expected.username);
  const passwordMatches = timingSafeEqual(provided.password, expected.password);

  return usernameMatches && passwordMatches ? { status: "authorized" } : { status: "unauthorized" };
}
