import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /go/* are tracked redirects and /stats is private; neither belongs in an
      // index, and crawling /go/* would inflate click counts.
      disallow: ["/go/", "/stats", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
