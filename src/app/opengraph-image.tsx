import { ImageResponse } from "next/og";

import { accent, config } from "@/lib/config";
import { initials } from "@/lib/initials";

export const alt = config.metadata.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share image, rendered from links.json at build time.
 *
 * Uses a typographic monogram rather than the avatar file so the image renders
 * identically whatever image format the operator drops into /public, and needs
 * no external image service, font download or network access.
 *
 * The layout is deliberately flat — hairline rules, one short accent mark, and
 * type doing the work. Nothing here is a gradient or a glow.
 */
export default function OpengraphImage() {
  const { profile, metadata } = config;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px 80px",
          backgroundColor: "#0a0a0b",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", width: 88, height: 3, backgroundColor: accent }} />

          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 104,
                height: 104,
                borderRadius: 24,
                border: "1px solid #2a2a30",
                color: "#f4f4f5",
                fontSize: 40,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {initials(profile.name)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 60, fontWeight: 600, letterSpacing: "-0.03em" }}>{profile.name}</div>
              <div style={{ fontSize: 27, color: "#70707a" }}>{profile.handle}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 31,
            lineHeight: 1.4,
            color: "#a1a1aa",
            maxWidth: 920,
          }}
        >
          {metadata.description}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: "1px solid #1e1e22",
            fontSize: 21,
            color: "#70707a",
          }}
        >
          <div style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}>Linkfile</div>
          {profile.location ? <div>{profile.location}</div> : null}
        </div>
      </div>
    ),
    size,
  );
}
