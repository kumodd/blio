import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "blio — AI prospecting for local business sales", template: "%s · blio" },
  description: "Find local businesses, understand why they fit, and prepare personalized outreach with blio.",
  keywords: ["AI prospecting", "local business leads", "sales outreach", "lead intelligence", "Google Maps leads"],
  openGraph: { type: "website", siteName: "blio", title: "blio — AI prospecting for local business sales", description: "Discover, score, and reach the right local business prospects." },
  twitter: { card: "summary_large_image", title: "blio — AI prospecting for local business sales", description: "Discover, score, and reach the right local business prospects." },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
