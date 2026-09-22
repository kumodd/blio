import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { suggestCampaignDefaults } from "@/lib/ai";
import { normalizeWebsiteUrl, scrapeSellerWebsite } from "@/lib/research/website";

export const maxDuration = 45;

const requestSchema = z.object({ websiteUrl: z.string().trim().min(1).max(500) });

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a website URL first." }, { status: 400 });

    let websiteUrl: string | undefined;
    try {
      websiteUrl = normalizeWebsiteUrl(parsed.data.websiteUrl);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Enter a valid public website URL." }, { status: 400 });
    }
    if (!websiteUrl) return NextResponse.json({ error: "Enter a website URL first." }, { status: 400 });

    const sellerProfile = await scrapeSellerWebsite(websiteUrl);
    if (!sellerProfile) return NextResponse.json({ error: "We could not read that website." }, { status: 422 });
    const defaults = await suggestCampaignDefaults(sellerProfile);
    return NextResponse.json({ sellerProfile, defaults }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not analyze this website." }, { status: 500 });
  }
}
