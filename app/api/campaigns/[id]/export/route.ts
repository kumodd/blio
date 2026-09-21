import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getCampaign, listLeads } from "@/lib/data";

function csv(value: unknown) {
  const stringValue = String(value ?? "").replace(/"/g, '""');
  return `"${stringValue}"`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const campaign = await getCampaign(user.id, id);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  const leads = await listLeads(user.id, id);
  const header = ["business", "category", "address", "phone", "website", "rating", "review_count", "fit_score", "status", "tags", "notes", "sources"];
  const rows = leads.map((lead) => [lead.business.name, lead.business.category, lead.business.address, lead.business.phone, lead.business.website, lead.business.rating, lead.business.reviewCount, lead.score, lead.status, lead.tags.join(", "), lead.notes, lead.business.sources.map((source) => source.sourceUrl ?? source.provider).join(" | ")]);
  const body = [header, ...rows].map((row) => row.map(csv).join(",")).join("\n");
  return new NextResponse(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-leads.csv"`, "cache-control": "no-store" } });
}
