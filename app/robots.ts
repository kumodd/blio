import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { rules: { userAgent: "*", allow: ["/", "/about", "/pricing", "/contact", "/privacy", "/terms", "/refund-cancellation", "/login"], disallow: ["/dashboard", "/campaigns", "/leads", "/jobs", "/settings", "/api/"] }, sitemap: `${baseUrl}/sitemap.xml` };
}
