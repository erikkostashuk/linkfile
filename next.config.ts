import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Pin the bundler's workspace root to this directory.
 *
 * Without it, Next.js walks up looking for a lockfile and can pick a parent
 * directory, which makes the standalone build output nest under the wrong path.
 */
const projectRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Content Security Policy.
 *
 * Linkfile ships no third-party scripts, fonts, images or analytics, so
 * everything is locked to `'self'`. Two allowances are deliberate and necessary:
 *
 * - `'unsafe-inline'` in `style-src`: React writes the accent custom property as
 *   an inline style attribute, and Next.js inlines critical CSS.
 * - `'unsafe-inline'` in `script-src`: Next.js bootstraps the app with inline
 *   scripts. A nonce would require running proxy middleware on every request,
 *   which is a real cost for a page that has no application JavaScript at all.
 *
 * `'unsafe-eval'` is added in development only, for React Refresh.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self'",
  "manifest-src 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  turbopack: { root: projectRoot },

  // Emits .next/standalone with a self-contained server.js, which is what the
  // Dockerfile copies into its slim runtime stage. Ignored when deploying to
  // Vercel, which builds its own output.
  output: "standalone",

  // Trim log noise from the redirect route on a busy profile.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
