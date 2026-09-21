import Link from "next/link";
import { ArrowUpRight, Globe, MapPin, MessageCircle, Phone } from "lucide-react";

import type { Lead } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Score, StatusBadge } from "./ui";

export function LeadTable({ leads }: { leads: Lead[] }) {
  if (!leads.length) return <div className="empty-state"><div className="empty-icon"><MapPin /></div><h3>No leads yet</h3><p>Run research for this campaign to discover and enrich businesses in your target market.</p></div>;
  return <div className="table-card"><table className="lead-table"><thead><tr><th>Business</th><th>Fit score</th><th>Signals</th><th>Status</th><th /></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><Link className="business-cell" href={`/leads/${lead.id}`}><span className="business-avatar">{initials(lead.business.name)}</span><span><span className="business-title">{lead.business.name}</span><span className="business-subtitle">{lead.business.category} · {lead.business.city ?? lead.business.address}</span></span></Link></td><td><Score value={lead.score} /></td><td><span style={{ display: "inline-flex", gap: 5, color: "var(--muted)" }}>{lead.business.website ? <Globe size={14} /> : null}{lead.business.phone ? <Phone size={14} /> : null}{lead.business.contacts.some((contact) => contact.type === "whatsapp") ? <MessageCircle size={14} /> : null}</span></td><td><StatusBadge status={lead.status} /></td><td><Link href={`/leads/${lead.id}`} className="button button-ghost" aria-label={`Open ${lead.business.name}`}><ArrowUpRight /></Link></td></tr>)}</tbody></table></div>;
}
