import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { LeadsBrowser } from "@/components/leads-browser";
import { getCurrentUser } from "@/lib/auth";
import { listCampaigns, listLeads } from "@/lib/data";

export default async function AllLeadsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const campaigns = await listCampaigns(user.id);
  const leads = (await Promise.all(campaigns.map((campaign) => listLeads(user.id, campaign.id)))).flat();
  return <><div className="topbar"><div><p className="eyebrow">Workspace</p><h1>All leads</h1><p className="subtitle">One review queue across every active campaign.</p></div><div className="actions"><Link href="/campaigns" className="button button-secondary">Campaigns <ArrowRight /></Link></div></div><section className="card section-card">{leads.length ? <LeadsBrowser leads={leads} /> : <div className="empty-state"><div className="empty-icon"><Users /></div><h3>Your lead queue is empty</h3><p>Create a campaign and run research to start building a useful list.</p><Link className="button button-primary" href="/campaigns/new">Create campaign <ArrowRight /></Link></div>}</section></>;
}
