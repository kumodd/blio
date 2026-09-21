import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, MessageSquare, Send, Users } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const stats = await getDashboardStats(user.id);
  const metrics = [{ label: "Activation", value: stats.campaigns ? 100 : 0, detail: "users with a campaign", icon: BarChart3 }, { label: "Lead usability", value: stats.discovered ? Math.round((stats.saved / stats.discovered) * 100) : 0, detail: "leads reviewed or saved", icon: CheckCircle2 }, { label: "Contactability", value: stats.discovered ? Math.round((stats.contacted / stats.discovered) * 100) : 0, detail: "leads moved to contact", icon: Send }, { label: "Reply rate", value: stats.contacted ? Math.round((stats.replied / stats.contacted) * 100) : 0, detail: "replies from contacted leads", icon: MessageSquare }];
  return <><div className="topbar"><div><p className="eyebrow">Workspace signals</p><h1>Analytics</h1><p className="subtitle">A lightweight view of whether research is turning into action.</p></div><Link className="button button-secondary" href="/dashboard"><ArrowLeft /> Overview</Link></div><div className="stat-grid">{metrics.map((metric) => { const Icon = metric.icon; return <div className="card stat-card" key={metric.label}><div className="stat-label"><Icon /> {metric.label}</div><div className="stat-value">{metric.value}%</div><div className="stat-foot">{metric.detail}</div><div className="progress-track" style={{ marginTop: 15 }}><div className="progress-bar" style={{ width: `${metric.value}%` }} /></div></div>; })}</div><section className="card section-card"><div className="section-heading"><div><h2>Workspace totals</h2><p>Simple counts from your current lead pipeline.</p></div><Users color="var(--forest)" /></div><div className="fact-grid"><div className="fact"><div className="fact-label">Businesses discovered</div><div className="fact-value">{stats.discovered}</div></div><div className="fact"><div className="fact-label">Reviewed or saved</div><div className="fact-value">{stats.saved}</div></div><div className="fact"><div className="fact-label">Contacted</div><div className="fact-value">{stats.contacted}</div></div><div className="fact"><div className="fact-label">Meetings</div><div className="fact-value">{stats.meetings}</div></div></div></section></>;
}
