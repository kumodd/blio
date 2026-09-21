import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExportButton } from "@/components/export-button";
import { LeadsBrowser } from "@/components/leads-browser";
import { ResearchLaunchButton } from "@/components/research-launch-button";
import { getCurrentUser } from "@/lib/auth";
import { getCampaign, listLeads } from "@/lib/data";

export default async function CampaignLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const campaign = await getCampaign(user.id, id);
  if (!campaign) return null;
  const leads = await listLeads(user.id, campaign.id);
  return <><Link className="back-link" href={`/campaigns/${campaign.id}`}><ArrowLeft size={14} /> {campaign.name}</Link><div className="topbar"><div><p className="eyebrow">Lead workspace</p><h1>Research results</h1><p className="subtitle">{leads.length} businesses found across {campaign.locations.join(", ")}.</p></div><div className="actions"><ExportButton campaignId={campaign.id} /><ResearchLaunchButton campaignId={campaign.id} compact /></div></div><section className="card section-card"><LeadsBrowser leads={leads} /></section></>;
}
