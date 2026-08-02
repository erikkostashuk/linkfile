import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { accent, accentForeground, config } from "@/lib/config";
import { siteUrl } from "@/lib/site";

import "./globals.css";

const { profile, metadata: pageMetadata } = config;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: pageMetadata.title,
  description: pageMetadata.description,
  applicationName: "Linkfile",
  authors: [{ name: profile.name }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: siteUrl,
    siteName: profile.name,
    title: pageMetadata.title,
    description: pageMetadata.description,
    username: profile.handle.replace(/^@/, ""),
  },
  twitter: {
    card: "summary_large_image",
    title: pageMetadata.title,
    description: pageMetadata.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

/**
 * The accent from links.json is published as a CSS custom property on <html>.
 * Every accent-derived colour in globals.css is computed from it with
 * `color-mix`, so one JSON value themes the whole site with no client script.
 */
const accentVariables = {
  "--accent": accent,
  "--accent-foreground": accentForeground,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={accentVariables}>
      <body>{children}</body>
    </html>
  );
}
