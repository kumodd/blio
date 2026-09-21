import Link from "next/link";
import { ArrowUpRight, Globe, MapPin, MessageCircle, Phone, Star } from "lucide-react";

import type { Lead } from "@/lib/types";
import { LeadMedia } from "./lead-media";
import { Score, StatusBadge } from "./ui";

export function LeadCardGrid({ leads }: { leads: Lead[] }) {
  if (!leads.length) return <div className="empty-state"><div className="empty-icon"><MapPin /></div><h3>No prospects yet</h3><p>Run research for this campaign to discover and enrich businesses in your target market.</p></div>;
  return <div className="lead-card-grid">{leads.map((lead) => {
    const highlights = lead.signals.filter((signal) => signal.positive).slice(0, 3);
    const fallbackHighlight = lead.reasoning[0] ?? "Relevant business found in your target market.";
    const phone = lead.business.phone ?? lead.business.contacts.find((contact) => contact.type === "phone")?.value;
    const hasWhatsApp = lead.business.contacts.some((contact) => contact.type === "whatsapp");
    const hasEmail = lead.business.contacts.some((contact) => contact.type === "email");
    return <Link className="lead-card" href={`/leads/${lead.id}`} key={lead.id}><LeadMedia business={lead.business} className="lead-card-media" /><div className="lead-card-body"><div className="lead-card-top"><div><div className="lead-card-category">{lead.business.category}</div><h3 className="lead-card-title">{lead.business.name}</h3></div><StatusBadge status={lead.status} /></div><div className="lead-card-location"><MapPin size={13} /> {lead.business.city ?? lead.business.address}</div><div className="lead-card-score"><div><span className="lead-card-label">Opportunity score</span><Score value={lead.score} /></div>{lead.business.rating ? <div className="lead-rating"><Star size={14} fill="currentColor" /> {lead.business.rating} <span>({lead.business.reviewCount ?? 0})</span></div> : null}</div><div className="lead-highlight"><span className="lead-highlight-title">Highlights</span>{highlights.length ? <div className="highlight-chips">{highlights.map((signal) => <span className="highlight-chip" key={`${signal.label}-${signal.value}`}>{signal.label}: {signal.value}</span>)}</div> : <p>{fallbackHighlight}</p>}</div><div className="lead-card-footer"><span className="lead-contact-icons">{lead.business.website ? <Globe size={14} /> : null}{phone ? <Phone size={14} /> : null}{hasWhatsApp ? <MessageCircle size={14} /> : null}{hasEmail ? <span className="lead-contact-count">Email</span> : null}</span><span className="lead-card-open">View profile <ArrowUpRight size={14} /></span></div></div></Link>;
  })}</div>;
}
