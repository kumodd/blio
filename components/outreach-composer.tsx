"use client";

import { Check, Clipboard, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

import type { OutreachDraft, OutreachChannel, SellerProfile } from "@/lib/types";
import { phoneUrl, safeUrl, smsUrl, whatsappUrl } from "@/lib/utils";

const channels: Array<Extract<OutreachChannel, "email" | "whatsapp" | "instagram" | "sms" | "phone">> = ["email", "whatsapp", "instagram", "sms", "phone"];
const channelLabels = { email: "Email", whatsapp: "WhatsApp", instagram: "Instagram", sms: "SMS", phone: "Call" } as const;

export function OutreachComposer({ leadId, phone, email, instagram, sellerProfile, initialDrafts }: { leadId: string; phone?: string; email?: string; instagram?: string; sellerProfile?: SellerProfile; initialDrafts: OutreachDraft[] }) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [channel, setChannel] = useState<typeof channels[number]>(initialDrafts.find((draft) => channels.includes(draft.channel as typeof channels[number]))?.channel as typeof channels[number] ?? "email");
  const [body, setBody] = useState(initialDrafts.find((draft) => draft.channel === channel)?.body ?? "");
  const [subject, setSubject] = useState(initialDrafts.find((draft) => draft.channel === channel)?.subject ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const currentDraft = drafts.find((draft) => draft.channel === channel);

  function selectChannel(next: typeof channels[number]) {
    setChannel(next);
    const draft = drafts.find((item) => item.channel === next);
    setBody(draft?.body ?? "");
    setSubject(draft?.subject ?? "");
    setCopied(false);
    setError("");
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/leads/${leadId}/outreach`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Could not generate outreach.");
      if (!Array.isArray(payload.drafts) || !payload.drafts.length) throw new Error("The outreach provider returned no drafts.");
      setDrafts(payload.drafts);
      const draft = payload.drafts.find((item: OutreachDraft) => item.channel === channel) ?? payload.drafts[0];
      setChannel(draft.channel);
      setBody(draft.body);
      setSubject(draft.subject ?? "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not generate outreach.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(channel === "email" && subject ? `Subject: ${subject}\n\n${body}` : body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Select the message and copy it manually.");
    }
  }

  const destination = channel === "whatsapp" ? whatsappUrl(phone, body) : channel === "sms" ? smsUrl(phone, body) : channel === "phone" ? phoneUrl(phone) : channel === "instagram" ? safeUrl(instagram) : `mailto:${email ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return <div className="card draft-card" aria-busy={loading}><div className="draft-header"><div><h2>AI outreach</h2><p>Grounded in the prospect’s public evidence and your business profile. Edit before you contact them.</p></div><span style={{ color: "var(--forest)", background: "var(--forest-soft)", padding: "7px 8px", borderRadius: 8 }}><Clipboard size={15} /></span></div><div className={`seller-context-note ${sellerProfile ? "seller-context-ready" : "seller-context-missing"}`}>{sellerProfile ? <><Check size={14} /><span>Using <strong>{sellerProfile.name ?? sellerProfile.websiteUrl}</strong> as your sender context.</span></> : <><span>For stronger personalization, add your business website in the campaign settings.</span></>}</div><div className="draft-tabs">{channels.map((item) => <button className={`draft-tab ${channel === item ? "active" : ""}`} key={item} onClick={() => selectChannel(item)} disabled={loading} type="button">{channelLabels[item]}</button>)}</div>{channel === "email" ? <div className="form-field" style={{ marginBottom: 9 }}><label className="label" htmlFor="subject">Subject</label><input className="input" id="subject" value={subject} disabled={loading} onChange={(event) => setSubject(event.target.value)} placeholder="A useful idea for this business" /></div> : null}<textarea className="textarea draft-body" value={body} disabled={loading} onChange={(event) => setBody(event.target.value)} placeholder="Generate a personalized draft when you are ready…" />{currentDraft ? <div className="draft-meta">Generated with {currentDraft.model} · {currentDraft.promptVersion}</div> : null}{loading ? <div className="async-status" role="status">Writing grounded drafts from the prospect evidence…</div> : null}{error ? <div className="alert alert-error" style={{ marginTop: 10 }} role="alert">{error}</div> : null}<div className="draft-actions"><button className="button button-secondary" type="button" onClick={generate} disabled={loading} aria-busy={loading}>{loading ? <Loader2 className="spin" /> : <RefreshCw />} {loading ? "Writing…" : drafts.length ? "Regenerate" : "Generate outreach"}</button>{body ? <div className="actions"><button className="button button-ghost" onClick={copy} disabled={loading} type="button">{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}</button>{destination ? <a className="button button-primary" href={destination} target={channel === "phone" || channel === "sms" ? undefined : "_blank"} rel="noreferrer"><ExternalLink /> Open</a> : null}</div> : null}</div></div>;
}
