import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createDraft, getCampaign, getLead } from "@/lib/data";
import { generateGroundedDrafts } from "@/lib/ai";
import type { OutreachChannel } from "@/lib/types";

export const maxDuration = 30;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const lead = await getLead(user.id, id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const campaign = await getCampaign(user.id, lead.campaignId);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const generated = await generateGroundedDrafts(campaign, lead);
    const drafts = await Promise.all(generated.drafts.map((draft: { channel: OutreachChannel; body: string; subject?: string }) => createDraft(user.id, { leadId: lead.id, channel: draft.channel, body: draft.body, subject: draft.subject, model: generated.model, promptVersion: generated.promptVersion })));
    return NextResponse.json({ drafts });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate outreach" }, { status: 500 });
  }
}
