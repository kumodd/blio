"use client";

import { Check, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Lead, LeadStatus } from "@/lib/types";

export function LeadActions({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [tags, setTags] = useState(lead.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  async function save(patch: Record<string, unknown>) {
    setSaving(true); setSaved(false); setError("");
    try {
      const response = await fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Could not save this update.");
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2200);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this update.");
      if (typeof patch.status === "string") setStatus(lead.status);
    } finally {
      setSaving(false);
    }
  }
  return <div className="card detail-card"><div className="section-heading"><div><h2>Sales pipeline</h2><p>Move each prospect toward the next commercial step.</p></div>{saved ? <span style={{ color: "var(--forest)", fontSize: 11, fontWeight: 700 }}><Check size={14} style={{ verticalAlign: "middle" }} /> Saved</span> : null}</div><div className="form-field"><label className="label" htmlFor="status">Pipeline stage</label><select className="select" id="status" value={status} disabled={saving} onChange={(event) => { const next = event.target.value as LeadStatus; setStatus(next); void save({ status: next, ...(next === "contacted" ? { lastContactedAt: new Date().toISOString() } : {}) }); }}><option value="new">New</option><option value="reviewed">Qualified</option><option value="contacted">Contacted</option><option value="replied">Replied</option><option value="interested">Interested</option><option value="meeting">Meeting</option><option value="proposal">Proposal</option><option value="won">Won</option><option value="not_fit">Lost</option></select></div><div className="form-field" style={{ marginTop: 15 }}><label className="label" htmlFor="tags">Tags</label><input className="input" id="tags" value={tags} disabled={saving} onChange={(event) => setTags(event.target.value)} placeholder="high-fit, referral, follow-up" /><span className="help">Separate tags with commas.</span></div><div className="form-field" style={{ marginTop: 15 }}><label className="label" htmlFor="notes">Private notes</label><textarea className="textarea" id="notes" rows={4} value={notes} disabled={saving} onChange={(event) => setNotes(event.target.value)} placeholder="Add context for your next touch…" /></div>{error ? <div className="inline-error" role="alert">{error}</div> : null}<button className="button button-secondary" style={{ marginTop: 10 }} type="button" disabled={saving} onClick={() => void save({ notes, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) })}>{saving ? <Loader2 className="spin" /> : <Save />} {saving ? "Saving…" : "Save workflow"}</button></div>;
}
