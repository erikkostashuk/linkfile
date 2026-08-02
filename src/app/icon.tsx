import { ImageResponse } from "next/og";

import { accent, accentForeground, config } from "@/lib/config";
import { initials } from "@/lib/initials";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: accent,
        color: accentForeground,
        fontFamily: "sans-serif",
        fontSize: 34,
        fontWeight: 700,
        letterSpacing: "-0.03em",
      }}
    >
      {initials(config.profile.name)}
    </div>,
    size,
  );
}
