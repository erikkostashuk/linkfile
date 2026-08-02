import { NextResponse, type NextRequest } from "next/server";

import { authorizeStatsRequest, WWW_AUTHENTICATE } from "@/lib/auth";

export const config = {
  matcher: ["/stats", "/stats/:path*"],
};

const NO_STORE = "no-store, no-cache, must-revalidate, private";

let warnedAboutMissingCredentials = false;

export default function proxy(request: NextRequest): NextResponse {
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

    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": NO_STORE,
      },
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
