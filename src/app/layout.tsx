import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { accent, config } from "@/lib/config";
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
  colorScheme: "light",
  themeColor: "#f4f7fb",
};

const accentVariables = {
  "--accent": accent,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={accentVariables}>
      <body>{children}</body>
    </html>
  );
}
