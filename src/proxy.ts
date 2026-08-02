import { NextResponse, type NextRequest } from "next/server";

import { authorizeStatsRequest, WWW_AUTHENTICATE } from "@/lib/auth";

/**
 * Gate in front of /stats.
 *
 * Only /stats is matched — the profile page, redirects and health check stay
 * completely uninterrupted, so a proxy failure can never take the public page
 * down.
 *
 * The page itself repeats this check. Running it in both places means a
 * bypassed or misconfigured proxy layer cannot expose statistics on its own.
 */
export const config = {
  matcher: ["/stats", "/stats/:path*"],
};

const NO_STORE = "no-store, no-cache, must-revalidate, private";

let warnedAboutMissingCredentials = false;

export default function proxy(request: NextRequest): NextResponse {
  // Read each variable by name rather than passing `process.env` wholesale, so
  // the values are statically inlined correctly whichever runtime this runs in.
  const result = authorizeStatsRequest(request.headers.get("authorization"), {
    STATS_USERNAME: process.env.STATS_USERNAME,
    STATS_PASSWORD: process.env.STATS_PASSWORD,
  });

  if (result.status === "not-configured") {
    if (!warnedAboutMissingCredentials) {
      warnedAboutMissingCredentials = true;
      console.warn(
        "[linkfile] /stats is disabled: set STATS_USERNAME and STATS_PASSWORD to enable the statistics page.",
      );
    }

    // 404 rather than 401: an unconfigured deployment should not advertise that
    // a protected page exists, and prompting for credentials that cannot work
    // would only invite guessing.
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": NO_STORE },
    });
  }

  if (result.status === "unauthorized") {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": WWW_AUTHENTICATE,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": NO_STORE,
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", NO_STORE);
  return response;
}
