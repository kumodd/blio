import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, MessageSquare, Plus, Search, Send, Sparkles, Target, Users } from "lucide-react";

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
    <div className="topbar"><div><p className="eyebrow">{formatDate(new Date().toISOString(), { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p><h1>Find the businesses that need what you sell.</h1><p className="subtitle">Turn your offer, target market, and location into a prioritized list of likely clients—then use real business signals to start a relevant conversation.</p></div><div className="actions"><Link href="/campaigns/new" className="button button-primary"><Plus /> Build a target market</Link></div></div>
    <section className="sales-hero">
      <div className="sales-hero-copy">
        <p className="eyebrow">Your client-finding engine</p>
        <h2>Stop guessing who to contact. Find the businesses most likely to need your service.</h2>
        <p>QuickLeads searches your chosen area and business type, enriches each prospect, spots commercial opportunities, and ranks the strongest fits. You spend your time selling—not building another spreadsheet.</p>
        <div className="actions sales-hero-actions"><Link href="/campaigns/new" className="button sales-hero-cta"><Target /> Define your ideal client <ArrowRight /></Link><span>Offer → market → opportunity → outreach</span></div>
      </div>
      <div className="sales-hero-steps" aria-label="How QuickLeads finds target clients">
        <div className="sales-hero-step"><span className="sales-step-number">01</span><div><strong>Define what you sell</strong><small>Website, SEO, consulting, software, or any business service.</small></div></div>
        <div className="sales-hero-step"><span className="sales-step-number">02</span><div><strong>Choose who and where</strong><small>Target a business type in a city or radius.</small></div></div>
        <div className="sales-hero-step"><span className="sales-step-number">03</span><div><strong>See the reason to reach out</strong><small>AI highlights gaps, fit, urgency, and the best next touch.</small></div></div>
      </div>
    </section>
    <div className="stat-grid">
      <div className="card stat-card"><div className="stat-label"><BriefcaseBusiness /> Active campaigns</div><div className="stat-value">{stats.campaigns}</div><div className="stat-foot">Keep your market focus tight</div></div>
      <div className="card stat-card"><div className="stat-label"><Users /> Businesses discovered</div><div className="stat-value">{formatNumber(stats.discovered)}</div><div className="stat-foot">Across all campaigns</div></div>
      <div className="card stat-card"><div className="stat-label"><Send /> Contacted</div><div className="stat-value">{formatNumber(stats.contacted)}</div><div className="stat-foot">Human-reviewed outreach</div></div>
      <div className="card stat-card"><div className="stat-label"><MessageSquare /> Replies</div><div className="stat-value">{formatNumber(stats.replied)}</div><div className="stat-foot">Turn conversations into signal</div></div>
    </div>
    <section className="card section-card sales-flow"><div className="section-heading"><div><p className="eyebrow">A repeatable sales motion</p><h2>From a vague idea to a qualified prospect list.</h2><p>Every step is designed to move you closer to a client conversation.</p></div></div><div className="sales-flow-grid"><div className="sales-flow-card"><Search /><span>01 · Discover</span><h3>Find matching businesses</h3><p>Search by location, radius, and business type instead of relying on referrals alone.</p></div><div className="sales-flow-card"><Sparkles /><span>02 · Understand</span><h3>Reveal the opportunity</h3><p>See public evidence such as weak websites, missing contact paths, or online visibility gaps.</p></div><div className="sales-flow-card"><Target /><span>03 · Prioritize</span><h3>Work the best fits first</h3><p>Opportunity scores help you focus your limited sales time on prospects with stronger relevance.</p></div><div className="sales-flow-card"><MessageSquare /><span>04 · Start relevant</span><h3>Open the right conversation</h3><p>Generate an outreach draft grounded in what is actually visible about that business.</p></div></div></section>
    <div className="split-grid">
      <section className="card section-card"><div className="section-heading"><div><h2>Your campaigns</h2><p>Each campaign is a focused market hypothesis.</p></div><Link className="text-link" href="/campaigns">View all <ArrowRight size={13} style={{ verticalAlign: "middle" }} /></Link></div>{campaigns.length ? campaigns.slice(0, 4).map((campaign) => <div className="campaign-row" key={campaign.id}><div><Link className="campaign-name" href={`/campaigns/${campaign.id}`}>{campaign.name}</Link><div className="campaign-meta">{campaign.category} · {campaign.locations.join(", ")}</div></div><div className="campaign-right"><div className="campaign-count">{(recent.filter((lead) => lead.campaignId === campaign.id).length || (campaign.id === campaigns[0]?.id ? recent.length : 0))}</div><div className="campaign-count-label">leads</div></div></div>) : <div className="empty-state"><h3>Start with one campaign</h3><p>Describe what you sell and where you want to sell it.</p><Link href="/campaigns/new" className="button button-primary">Create campaign <ArrowRight /></Link></div>}</section>
      <section className="card section-card"><div className="section-heading"><div><h2>Recent signal</h2><p>The next best leads to review.</p></div></div>{recent.length ? recent.slice(0, 4).map((lead) => <div className="activity-row" key={lead.id}><span className="activity-dot" /><div><div className="activity-text"><strong>{lead.business.name}</strong> is a {lead.score}% fit for your campaign.</div><div className="activity-time">{formatRelativeDate(lead.updatedAt)} · {lead.business.city ?? lead.business.address}</div></div></div>) : <div className="empty-state" style={{ padding: "20px 0" }}><CheckCircle2 style={{ color: "var(--forest)" }} /><p style={{ marginTop: 10 }}>No lead activity yet.</p></div>}</section>
    </div>
    <section className="card section-card dashboard-cta" style={{ marginTop: 18 }}><div className="dashboard-cta-copy"><p className="eyebrow">A better first touch</p><h2>Research gives you the reason. You bring the relationship.</h2><p>Every QuickLeads lead is grounded in public evidence, so your outreach can sound specific without pretending to know more than you do.</p>{campaigns[0] ? <ResearchLaunchButton campaignId={campaigns[0].id} /> : <Link href="/campaigns/new" className="button dashboard-cta-button">Create your first campaign <ArrowRight /></Link>}</div><div className="dashboard-cta-orbit" /></section>
  </>;
}
