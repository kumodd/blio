import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Globe, Instagram, Mail, MapPin, MessageCircle, Phone, Sparkles, Star } from "lucide-react";

import { LeadActions } from "@/components/lead-actions";
import { LeadMedia } from "@/components/lead-media";
import { OutreachComposer } from "@/components/outreach-composer";
import { ProspectAnalysisPanel } from "@/components/prospect-analysis";
import { StatusBadge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getCampaign, getLead, listDrafts } from "@/lib/data";
import { phoneUrl, safeUrl, smsUrl, whatsappUrl } from "@/lib/utils";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const lead = await getLead(user.id, id);
  if (!lead) return <div className="empty-state"><h3>Prospect not found</h3><Link href="/leads" className="button button-primary">Back to prospects</Link></div>;
  const [campaign, drafts] = await Promise.all([getCampaign(user.id, lead.campaignId), listDrafts(user.id, lead.id)]);
  const contacts = lead.business.contacts;
  const highlights = lead.signals.filter((signal) => signal.positive);
  const contactEmail = contacts.find((contact) => contact.type === "email")?.value;
  const instagram = contacts.find((contact) => contact.type === "instagram")?.value;

  return <>
    <Link className="back-link" href={`/campaigns/${lead.campaignId}/leads`}><ArrowLeft size={14} /> {campaign?.name ?? "Campaign prospects"}</Link>
    <div className="topbar"><div><p className="eyebrow">Prospect intelligence</p><h1>{lead.business.name}</h1><p className="subtitle">{lead.business.category} · {lead.business.city ?? lead.business.address}</p></div><div className="actions"><StatusBadge status={lead.status} /></div></div>
    <div className="detail-layout">
      <div className="card detail-card">
        <div className="lead-hero"><div className="lead-hero-main"><LeadMedia business={lead.business} className="lead-image-large" /><div><h2>{lead.business.name}</h2><div className="location"><MapPin />{lead.business.address}</div>{lead.business.rating ? <div className="lead-detail-rating"><Star size={14} fill="currentColor" /> {lead.business.rating} · {lead.business.reviewCount ?? 0} reviews</div> : null}</div></div><div className="score-panel"><div className="score-big">{lead.score}</div><div className="score-caption">opportunity score</div></div></div>
        <section className="highlight-panel"><div className="highlight-panel-heading"><div><p className="eyebrow">AI highlights</p><h2>What to notice</h2></div><Sparkles size={20} /></div>{highlights.length ? <div className="detail-highlight-grid">{highlights.map((signal) => <div className="detail-highlight" key={`${signal.label}-${signal.value}`}><span className="detail-highlight-dot" /><div><strong>{signal.label}</strong><span>{signal.value}</span></div></div>)}</div> : <p className="help">No positive signals were detected yet. Review the public facts before reaching out.</p>}</section>
        <ProspectAnalysisPanel leadId={lead.id} />
        <div className="detail-section"><h3><Sparkles /> Why this prospect fits</h3><div className="reason-list">{lead.reasoning.map((reason) => <div className="reason-row" key={reason}><CheckCircle2 />{reason}</div>)}</div></div>
        <div className="detail-section"><h3><Sparkles /> Key opportunities</h3><div className="signal-list">{lead.signals.map((signal) => <div className="signal-row" key={signal.label}><span className="signal-label">{signal.label}</span><span className={`signal-value ${signal.positive ? "positive" : "negative"}`}>{signal.value}</span></div>)}</div></div>
        <div className="detail-section"><h3><MapPin /> Business facts</h3><div className="fact-grid"><div className="fact"><div className="fact-label">Business type</div><div className="fact-value">{lead.business.category}</div></div><div className="fact"><div className="fact-label">Rating</div><div className="fact-value">{lead.business.rating ? `${lead.business.rating} / 5 · ${lead.business.reviewCount ?? 0} reviews` : "Not available"}</div></div><div className="fact" style={{ gridColumn: "1 / -1" }}><div className="fact-label">Description</div><div className="fact-value">{lead.business.description ?? "No description collected."}</div></div></div></div>
        <div className="detail-section"><h3><MessageCircle /> Contact paths</h3><div className="contact-list">{contacts.length ? contacts.map((contact) => { const href = contact.type === "phone" ? phoneUrl(contact.value) : contact.type === "whatsapp" ? whatsappUrl(contact.value) : contact.type === "sms" ? smsUrl(contact.value) : contact.type === "email" ? `mailto:${contact.value}` : safeUrl(contact.value); const Icon = contact.type === "phone" ? Phone : contact.type === "email" ? Mail : contact.type === "instagram" ? Instagram : contact.type === "website" ? Globe : MessageCircle; return <div className="contact-row" key={`${contact.type}-${contact.value}`}><Icon /><a href={href} target={contact.type === "phone" || contact.type === "sms" || contact.type === "email" ? undefined : "_blank"} rel="noreferrer">{contact.value}</a>{contact.verified ? <span className="help" style={{ marginLeft: "auto" }}>Verified</span> : null}</div>; }) : <p className="help">No public contact path was found.</p>}</div></div>
        <div className="detail-section"><h3><ExternalLink /> Source evidence</h3><div className="contact-list">{lead.business.sources.map((source, index) => <div className="source-row" key={`${source.provider}-${index}`}><span>{source.provider} · <span className="help">{new Date(source.observedAt).toLocaleDateString()}</span></span>{source.sourceUrl ? <a href={source.sourceUrl} target="_blank" rel="noreferrer">Open source <ExternalLink size={12} style={{ verticalAlign: "-2px" }} /></a> : null}</div>)}</div></div>
      </div>
      <div style={{ display: "grid", gap: 18, alignContent: "start" }}><OutreachComposer leadId={lead.id} phone={lead.business.phone} email={contactEmail} instagram={instagram} initialDrafts={drafts} /><LeadActions lead={lead} /></div>
    </div>
  </>;
}
