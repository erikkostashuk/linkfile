export type BasicCredentials = {
  username: string;
  password: string;
};

export const WWW_AUTHENTICATE =
  'Basic realm="Linkfile statistics", charset="UTF-8"';

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

export function parseBasicAuthHeader(
  header: string | null | undefined,
): BasicCredentials | null {
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
    decoded = new TextDecoder().decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
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

export function getStatsCredentials(
  env: StatsAuthEnv,
): BasicCredentials | null {
  const username = env.STATS_USERNAME?.trim();
  const password = env.STATS_PASSWORD ?? "";

  if (!username || password === "") {
    return null;
  }

  return { username, password };
}

export type AuthResult =
  | { status: "authorized" }
  | { status: "unauthorized" }
  | { status: "not-configured" };

export function authorizeStatsRequest(
  authorizationHeader: string | null | undefined,
  env: StatsAuthEnv,
): AuthResult {
  const expected = getStatsCredentials(env);

  if (!expected) {
    return { status: "not-configured" };
  }

  const provided = parseBasicAuthHeader(authorizationHeader);

  if (!provided) {
    return { status: "unauthorized" };
  }

  const usernameMatches = timingSafeEqual(provided.username, expected.username);
  const passwordMatches = timingSafeEqual(provided.password, expected.password);

  return usernameMatches && passwordMatches
    ? { status: "authorized" }
    : { status: "unauthorized" };
}
