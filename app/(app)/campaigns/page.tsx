import Link from "next/link";
import { ArrowRight, Plus, Search } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { listCampaigns, listLeads } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const campaigns = await listCampaigns(user.id);
  const counts = await Promise.all(campaigns.map(async (campaign) => [campaign.id, (await listLeads(user.id, campaign.id)).length] as const));
  const countMap = new Map(counts);
  return <><div className="topbar"><div><p className="eyebrow">Workspace</p><h1>Campaigns</h1><p className="subtitle">Each campaign turns an offer and a target market into a repeatable prospecting workflow.</p></div><Link href="/campaigns/new" className="button button-primary"><Plus /> New campaign</Link></div>{isDemoMode() ? <div className="alert alert-info">Demo mode is active. Campaigns are stored locally. Set <code>BLIO_DEMO_MODE=false</code> to use persistent Supabase campaigns.</div> : null}<section className="card section-card">{campaigns.length ? campaigns.map((campaign) => <div className="campaign-row" key={campaign.id}><div style={{ display: "flex", alignItems: "center", gap: 13 }}><div className="empty-icon" style={{ width: 38, height: 38, margin: 0, borderRadius: 11 }}><Search size={17} /></div><div><Link href={`/campaigns/${campaign.id}`} className="campaign-name">{campaign.name}</Link><div className="campaign-meta">{campaign.category} · {campaign.locations.join(", ")} · within {campaign.radiusKm} km · about {campaign.leadLimit} prospects · Updated {formatDate(campaign.updatedAt, { month: "short", day: "numeric" })}</div></div></div><div style={{ display: "flex", alignItems: "center", gap: 18 }}><div className="campaign-right"><div className="campaign-count">{countMap.get(campaign.id) ?? 0}</div><div className="campaign-count-label">leads</div></div><Link href={`/campaigns/${campaign.id}`} className="button button-ghost"><ArrowRight /></Link></div></div>) : <div className="empty-state"><div className="empty-icon"><Search /></div><h3>Your first market is one click away</h3><p>Define what you sell and who you want to sell it to.</p><Link href="/campaigns/new" className="button button-primary">Create campaign <Plus /></Link></div>}</section></>;
}
