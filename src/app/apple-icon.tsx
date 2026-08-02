import { ImageResponse } from "next/og";

import { accent, accentForeground, config } from "@/lib/config";
import { initials } from "@/lib/initials";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS, generated from the same configuration as the favicon. */
export default function AppleIcon() {
  return new ImageResponse(
    (
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
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: "-0.03em",
        }}
      >
        {initials(config.profile.name)}
      </div>
    ),
    size,
  );
}
