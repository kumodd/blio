import { Database, LogOut, ShieldCheck, UserRound } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { FormSubmitButton } from "@/components/form-submit-button";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <><div className="topbar"><div><p className="eyebrow">Workspace</p><h1>Settings</h1><p className="subtitle">Your account, data boundaries, and operating mode.</p></div></div><div className="split-grid"><section className="card section-card"><div className="section-heading"><div><h2>Profile</h2><p>Used to personalize your workspace.</p></div><UserRound color="var(--forest)" size={18} /></div><div className="fact-grid"><div className="fact"><div className="fact-label">Name</div><div className="fact-value">{user.name}</div></div><div className="fact"><div className="fact-label">Email</div><div className="fact-value">{user.email}</div></div></div></section><section className="card section-card"><div className="section-heading"><div><h2>Data & privacy</h2><p>Your research stays scoped to your workspace.</p></div><ShieldCheck color="var(--forest)" size={18} /></div><div className="activity-row"><ShieldCheck color="var(--forest)" size={16} /><div><div className="activity-text"><strong>Row-level security</strong> is enforced for Supabase-owned data.</div><div className="activity-time">Each campaign and lead is checked against your authenticated user.</div></div></div><div className="activity-row"><Database color="var(--forest)" size={16} /><div><div className="activity-text"><strong>{isDemoMode() ? "Demo storage" : "Supabase Postgres"}</strong> is currently active.</div><div className="activity-time">{isDemoMode() ? "Demo data resets when the server restarts." : "Source evidence and job state are stored durably."}</div></div></div></section></div><section className="card section-card" style={{ marginTop: 18 }}><div className="section-heading"><div><h2>Session</h2><p>Sign out from this browser.</p></div></div><form action={signOutAction}><FormSubmitButton className="button button-danger" pendingLabel="Signing out…"><LogOut /> Sign out</FormSubmitButton></form></section></>;
}
