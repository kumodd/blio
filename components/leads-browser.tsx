"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { Lead } from "@/lib/types";
import { LeadCardGrid } from "./lead-card-grid";

export function LeadsBrowser({ leads }: { leads: Lead[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => leads.filter((lead) => {
    const haystack = `${lead.business.name} ${lead.business.category} ${lead.business.address} ${lead.business.city ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === "all" || lead.status === status);
  }), [leads, query, status]);
  return <><div className="toolbar"><div className="search-box"><Search /><input className="input" placeholder="Search businesses, locations…" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="filter-row"><select className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All pipeline stages</option><option value="new">New</option><option value="reviewed">Qualified</option><option value="contacted">Contacted</option><option value="replied">Replied</option><option value="interested">Interested</option><option value="meeting">Meeting</option><option value="proposal">Proposal</option><option value="won">Won</option><option value="not_fit">Lost</option></select><span className="help">{filtered.length} of {leads.length} prospects</span></div></div><LeadCardGrid leads={filtered} /> </>;
}
