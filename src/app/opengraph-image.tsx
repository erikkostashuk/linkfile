import { ImageResponse } from "next/og";

import { accent, accentForeground, config } from "@/lib/config";
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
          padding: "72px 80px",
          backgroundColor: "#09090b",
          color: "#f7f7f5",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            backgroundColor: accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -260,
            left: 240,
            width: 720,
            height: 520,
            borderRadius: "50%",
            background: accent,
            opacity: 0.22,
            filter: "blur(120px)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 168,
              height: 168,
              borderRadius: 44,
              backgroundColor: accent,
              color: accentForeground,
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {initials(profile.name)}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 66, fontWeight: 700, letterSpacing: "-0.03em" }}>{profile.name}</div>
            <div style={{ fontSize: 32, color: "#a1a1ab" }}>{profile.handle}</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 34,
            lineHeight: 1.35,
            color: "#d4d4d8",
            maxWidth: 940,
          }}
        >
          {metadata.description}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#71717c" }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: accent }} />
            <div style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}>Built with Linkfile</div>
          </div>
          {profile.location ? <div style={{ color: "#71717c" }}>{profile.location}</div> : null}
        </div>
      </div>
    ),
    size,
  );
}
