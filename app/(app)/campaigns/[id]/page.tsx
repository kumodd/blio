import Link from "next/link";
import { ArrowLeft, ArrowRight, Edit3, Filter, Globe, MapPin, RefreshCw, Sparkles, Target } from "lucide-react";

import { ResearchLaunchButton } from "@/components/research-launch-button";
import { LeadCardGrid } from "@/components/lead-card-grid";
import { getCurrentUser } from "@/lib/auth";
import { getCampaign, listLeads } from "@/lib/data";

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ autostart?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const campaign = await getCampaign(user.id, id);
  if (!campaign) return <div className="empty-state"><h3>Campaign not found</h3><p>This campaign may have been archived or you may not have access to it.</p><Link href="/campaigns" className="button button-primary">Back to campaigns</Link></div>;
  const leads = await listLeads(user.id, campaign.id);
  return (
    <>
      <Link className="back-link" href="/campaigns"><ArrowLeft size={14} /> All campaigns</Link>
      <div className="topbar"><div><p className="eyebrow">Prospecting workspace</p><h1>{campaign.name}</h1><p className="subtitle"><MapPin size={14} style={{ verticalAlign: "-2px" }} /> {campaign.locations.join(", ")} · within {campaign.radiusKm} km · about {campaign.leadLimit} prospects · {campaign.category}</p></div><div className="actions"><Link className="button button-secondary" href={`/campaigns/${campaign.id}/edit`}><Edit3 /> Edit</Link><ResearchLaunchButton campaignId={campaign.id} compact autoStart={query.autostart === "1"} /></div></div>
      <div className="stat-grid"><div className="card stat-card"><div className="stat-label"><Filter /> Prospects found</div><div className="stat-value">{leads.length}</div><div className="stat-foot">Businesses matching your market</div></div><div className="card stat-card"><div className="stat-label"><RefreshCw /> Qualified</div><div className="stat-value">{leads.filter((lead) => !["new", "not_fit"].includes(lead.status)).length}</div><div className="stat-foot">Saved for follow-up</div></div><div className="card stat-card"><div className="stat-label"><Sparkles /> Avg. opportunity score</div><div className="stat-value">{leads.length ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length) : 0}</div><div className="stat-foot">AI-prioritized signal</div></div><div className="card stat-card"><div className="stat-label"><Target /> Search areas</div><div className="stat-value">{campaign.locations.length}</div><div className="stat-foot">Within {campaign.radiusKm} km each</div></div></div>
      <section className="card section-card"><div className="section-heading"><div><h2>Prospect workspace</h2><p>Discover → analyze → prioritize → start a conversation.</p></div><Link className="text-link" href={`/campaigns/${campaign.id}/leads`}>Open all prospects <ArrowRight size={13} style={{ verticalAlign: "middle" }} /></Link></div><LeadCardGrid leads={leads.slice(0, 6)} /></section>
      <section className="card section-card" style={{ marginTop: 18 }}><div className="section-heading"><div><h2>Target and opportunity brief</h2><p>This context grounds scoring and personalized outreach.</p></div></div><div className="fact-grid"><div className="fact"><div className="fact-label">What you sell</div><div className="fact-value">{campaign.context.offer}</div></div><div className="fact"><div className="fact-label">Ideal customer</div><div className="fact-value">{campaign.context.targetCustomer}</div></div><div className="fact"><div className="fact-label">Likely problem</div><div className="fact-value">{campaign.context.painPoint}</div></div><div className="fact"><div className="fact-label">Service opportunity</div><div className="fact-value">{campaign.context.valueProposition}</div></div></div>{campaign.context.sellerProfile ? <div className="seller-profile-summary"><div className="seller-profile-icon"><Globe size={17} /></div><div><div className="fact-label">Sender profile used in outreach</div><strong>{campaign.context.sellerProfile.name ?? campaign.context.sellerProfile.websiteUrl}</strong><p>{campaign.context.sellerProfile.services?.slice(0, 4).join(" · ") ?? campaign.context.sellerProfile.description ?? "Website context captured for personalized outreach."}</p><a className="text-link" href={campaign.context.sellerProfile.websiteUrl} target="_blank" rel="noreferrer">Open your website <ArrowRight size={13} style={{ verticalAlign: "-2px" }} /></a></div></div> : <div className="seller-profile-summary seller-profile-missing"><div className="seller-profile-icon"><Globe size={17} /></div><div><strong>Add your website to improve outreach relevance.</strong><p>QuickLeads will capture your business identity, services, and available contact details for the sender context.</p><Link className="text-link" href={`/campaigns/${campaign.id}/edit`}>Add website <ArrowRight size={13} style={{ verticalAlign: "-2px" }} /></Link></div></div>}</section>
    </>
  );
}
