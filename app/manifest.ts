import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QuickLeads",
    short_name: "QuickLeads",
    description: "AI prospecting and outreach for finding better-fit local business clients.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8f6",
    theme_color: "#0d5c4a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
