import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, MessageSquare, Plus, Send, Users } from "lucide-react";

import { ResearchLaunchButton } from "@/components/research-launch-button";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats, listCampaigns, listLeads } from "@/lib/data";
import { formatDate, formatRelativeDate, formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [stats, campaigns] = await Promise.all([getDashboardStats(user.id), listCampaigns(user.id)]);
  const recent = campaigns.length ? await listLeads(user.id, campaigns[0].id) : [];
  return <>
    <div className="topbar"><div><p className="eyebrow">{formatDate(new Date().toISOString(), { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p><h1>Good morning, {user.name.split(" ")[0]}.</h1><p className="subtitle">Here’s the pulse of your prospecting workspace.</p></div><div className="actions"><Link href="/campaigns/new" className="button button-primary"><Plus /> New campaign</Link></div></div>
    <div className="stat-grid">
      <div className="card stat-card"><div className="stat-label"><BriefcaseBusiness /> Active campaigns</div><div className="stat-value">{stats.campaigns}</div><div className="stat-foot">Keep your market focus tight</div></div>
      <div className="card stat-card"><div className="stat-label"><Users /> Businesses discovered</div><div className="stat-value">{formatNumber(stats.discovered)}</div><div className="stat-foot">Across all campaigns</div></div>
      <div className="card stat-card"><div className="stat-label"><Send /> Contacted</div><div className="stat-value">{formatNumber(stats.contacted)}</div><div className="stat-foot">Human-reviewed outreach</div></div>
      <div className="card stat-card"><div className="stat-label"><MessageSquare /> Replies</div><div className="stat-value">{formatNumber(stats.replied)}</div><div className="stat-foot">Turn conversations into signal</div></div>
    </div>
    <div className="split-grid">
      <section className="card section-card"><div className="section-heading"><div><h2>Your campaigns</h2><p>Each campaign is a focused market hypothesis.</p></div><Link className="text-link" href="/campaigns">View all <ArrowRight size={13} style={{ verticalAlign: "middle" }} /></Link></div>{campaigns.length ? campaigns.slice(0, 4).map((campaign) => <div className="campaign-row" key={campaign.id}><div><Link className="campaign-name" href={`/campaigns/${campaign.id}`}>{campaign.name}</Link><div className="campaign-meta">{campaign.category} · {campaign.locations.join(", ")}</div></div><div className="campaign-right"><div className="campaign-count">{(recent.filter((lead) => lead.campaignId === campaign.id).length || (campaign.id === campaigns[0]?.id ? recent.length : 0))}</div><div className="campaign-count-label">leads</div></div></div>) : <div className="empty-state"><h3>Start with one campaign</h3><p>Describe what you sell and where you want to sell it.</p><Link href="/campaigns/new" className="button button-primary">Create campaign <ArrowRight /></Link></div>}</section>
      <section className="card section-card"><div className="section-heading"><div><h2>Recent signal</h2><p>The next best leads to review.</p></div></div>{recent.length ? recent.slice(0, 4).map((lead) => <div className="activity-row" key={lead.id}><span className="activity-dot" /><div><div className="activity-text"><strong>{lead.business.name}</strong> is a {lead.score}% fit for your campaign.</div><div className="activity-time">{formatRelativeDate(lead.updatedAt)} · {lead.business.city ?? lead.business.address}</div></div></div>) : <div className="empty-state" style={{ padding: "20px 0" }}><CheckCircle2 style={{ color: "var(--forest)" }} /><p style={{ marginTop: 10 }}>No lead activity yet.</p></div>}</section>
    </div>
    <section className="card section-card" style={{ marginTop: 18, background: "var(--forest)", color: "white", border: 0, overflow: "hidden", position: "relative" }}><div style={{ position: "relative", zIndex: 1, maxWidth: 580 }}><p className="eyebrow" style={{ color: "var(--lime)" }}>A better first touch</p><h2 style={{ color: "white", fontSize: 25 }}>Research gives you the reason. You bring the relationship.</h2><p style={{ color: "#b9d5c8", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>Every blio lead is grounded in public evidence, so your outreach can sound specific without pretending to know more than you do.</p>{campaigns[0] ? <ResearchLaunchButton campaignId={campaigns[0].id} /> : <Link href="/campaigns/new" className="button" style={{ background: "var(--lime)", color: "var(--forest)" }}>Create your first campaign <ArrowRight /></Link>}</div><div style={{ position: "absolute", right: -40, bottom: -100, width: 330, height: 330, border: "1px solid rgba(201,233,108,.22)", borderRadius: "50%" }} /></section>
  </>;
}
