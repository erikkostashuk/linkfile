import { getClickStore } from "@/lib/clicks";
import { findLink } from "@/lib/config";

// The file click store writes with node:fs, and the PostgreSQL store uses a TCP
// driver — both require the Node.js runtime.
export const runtime = "nodejs";

// Every click must be counted, so this route is never cached or prerendered.
export const dynamic = "force-dynamic";

/**
 * First-party click tracking redirect: `/go/<slug>` → the configured destination.
 *
 * The destination is resolved *only* from the validated links.json. No query
 * parameter, header or path segment can influence where a visitor is sent, which
 * makes an open-redirect impossible by construction.
 *
 * Recording is best-effort: an analytics outage must never stop a visitor from
 * reaching the link they clicked.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await params;
  const link = findLink(slug);

  if (!link) {
    return new Response("Link not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const store = await getClickStore();
    await store.record({ slug: link.slug, clickedAt: new Date().toISOString() });
  } catch (error) {
    console.error(
      `[linkfile] Failed to record click for "${link.slug}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Built by hand rather than with Response.redirect so mailto: destinations are
  // passed through verbatim instead of being re-serialised by the URL parser.
  return new Response(null, {
    status: 302,
    headers: {
      Location: link.url,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
