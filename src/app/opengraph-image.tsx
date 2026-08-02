import { ImageResponse } from "next/og";

import { accent, accentForeground, config } from "@/lib/config";
import { initials } from "@/lib/initials";

export const alt = config.metadata.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const { profile, metadata } = config;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "52px 64px",
        backgroundColor: "#f4f7fb",
        color: "#0f172a",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 52px",
          border: "1px solid #e2e8f0",
          borderRadius: 32,
          backgroundColor: "#ffffff",
          boxShadow: "0 24px 64px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#64748b",
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: accent,
              }}
            />
            Linkfile
          </div>
          <div style={{ display: "flex", color: "#94a3b8", fontSize: 20 }}>
            Your links. One file.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 112,
              height: 112,
              borderRadius: 999,
              backgroundColor: accent,
              color: accentForeground,
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {initials(profile.name)}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 60,
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              {profile.name}
            </div>
            <div style={{ fontSize: 27, color: "#64748b" }}>
              {profile.handle}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            paddingTop: 28,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              maxWidth: 780,
              color: "#475569",
              fontSize: 28,
              lineHeight: 1.4,
            }}
          >
            {metadata.description}
          </div>
          {profile.location ? (
            <div
              style={{
                display: "flex",
                flex: "none",
                color: "#64748b",
                fontSize: 20,
              }}
            >
              {profile.location}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    size,
  );
}
