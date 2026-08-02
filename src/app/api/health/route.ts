import { getClickStore } from "@/lib/clicks";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness endpoint for uptime monitors, container health checks and reverse
 * proxies.
 *
 * Reports *which* click store is active and whether it persists, but never the
 * connection string, log path or credentials — enough to diagnose a
 * misconfiguration without handing an attacker infrastructure details.
 */
export async function GET(): Promise<Response> {
  let clicks: { store: string; persistent: boolean; reason?: string };

  try {
    const store = await getClickStore();
    clicks = {
      store: store.kind,
      persistent: store.persistent,
      ...(store.disabledReason ? { reason: store.disabledReason } : {}),
    };
  } catch (error) {
    clicks = {
      store: "misconfigured",
      persistent: false,
      reason: error instanceof Error ? error.message : "Unknown click store configuration error",
    };
  }

  return Response.json(
    {
      status: "ok",
      name: "linkfile",
      profile: config.profile.handle,
      links: config.links.length,
      time: new Date().toISOString(),
      clicks,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
