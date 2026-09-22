import { NextResponse } from "next/server";

import { analyzeProspectInformation } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { getCampaign, getLead } from "@/lib/data";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const lead = await getLead(user.id, id);
    if (!lead) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });

    const campaign = await getCampaign(user.id, lead.campaignId);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const analysis = await analyzeProspectInformation(campaign, lead);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Prospect analysis request failed:", error);
    return NextResponse.json({ error: "Could not analyze this prospect. Please try again." }, { status: 500 });
  }
}
