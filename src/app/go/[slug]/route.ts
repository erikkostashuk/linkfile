import { getClickStore } from "@/lib/clicks";
import { findLink } from "@/lib/config";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
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
    await store.record({
      slug: link.slug,
      clickedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `[linkfile] Failed to record click for "${link.slug}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: link.url,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
