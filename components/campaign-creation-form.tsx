"use client";

import Link from "next/link";
import { ArrowRight, Check, Loader2, MapPin, Sparkles, Target, WandSparkles } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { CampaignDefaults, SellerProfile } from "@/lib/types";

const autofillFields: Array<keyof CampaignDefaults> = ["name", "category", "locations", "offer", "targetCustomer", "painPoint", "valueProposition", "cta", "tone"];
const profileFields = ["sellerName", "sellerPhone", "sellerWhatsapp", "sellerEmail", "sellerAddress"] as const;

function setFormValue(form: HTMLFormElement, name: string, value: string) {
  const element = form.elements.namedItem(name);
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) element.value = value;
}

export function CampaignCreationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const lastRequestedUrl = useRef("");
  const requestVersion = useRef(0);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sellerProfileJson, setSellerProfileJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [autofillError, setAutofillError] = useState("");
  const [autofillStatus, setAutofillStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || loading) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/campaigns", { method: "POST", body: new FormData(event.currentTarget) });
      const payload = await response.json().catch(() => ({})) as { error?: string; campaign?: { id: string } };
      if (!response.ok || !payload.campaign?.id) throw new Error(payload.error ?? "Could not create campaign.");
      router.push(`/campaigns/${payload.campaign.id}?autostart=1`);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "Could not create campaign.");
      setSubmitting(false);
    }
  }

  async function autofillFromWebsite() {
    const value = websiteUrl.trim();
    if (!value || value === lastRequestedUrl.current) return;
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    lastRequestedUrl.current = value;
    setLoading(true);
    setAutofillError("");
    setAutofillStatus("Reading your website and preparing editable campaign defaults…");
    try {
      const response = await fetch("/api/campaigns/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ websiteUrl: value }) });
      const payload = await response.json().catch(() => ({})) as { error?: string; defaults?: CampaignDefaults; sellerProfile?: SellerProfile };
      if (!response.ok || !payload.defaults || !payload.sellerProfile) throw new Error(payload.error ?? "We could not analyze that website.");
      const form = formRef.current;
      if (!form || version !== requestVersion.current) return;
      for (const field of autofillFields) {
        const fieldValue = field === "locations" ? payload.defaults.locations.join(", ") : payload.defaults[field];
        setFormValue(form, field, fieldValue);
      }
      setFormValue(form, "sellerName", payload.sellerProfile.name ?? "");
      setFormValue(form, "sellerPhone", payload.sellerProfile.phone ?? "");
      setFormValue(form, "sellerWhatsapp", payload.sellerProfile.whatsapp ?? "");
      setFormValue(form, "sellerEmail", payload.sellerProfile.email ?? "");
      setFormValue(form, "sellerAddress", payload.sellerProfile.address ?? "");
      setSellerProfileJson(JSON.stringify(payload.sellerProfile));
      setAutofillStatus("Fields filled from your website. Review or edit anything before saving.");
    } catch (reason) {
      setAutofillError(reason instanceof Error ? reason.message : "We could not analyze that website.");
      setAutofillStatus("");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  function handleWebsiteChange(value: string) {
    if (sellerProfileJson && formRef.current) {
      for (const field of [...autofillFields, ...profileFields]) setFormValue(formRef.current, field, "");
    }
    requestVersion.current += 1;
    setWebsiteUrl(value);
    setSellerProfileJson("");
    setAutofillError("");
    setAutofillStatus("");
    if (value.trim() !== lastRequestedUrl.current) lastRequestedUrl.current = "";
  }

  return <form ref={formRef} className="card form-card" onSubmit={submitCampaign}>
    <input type="hidden" name="sellerProfileJson" value={sellerProfileJson} readOnly />
    <input type="hidden" name="sellerProfileEditor" value="1" readOnly />
    <section className="form-section">
      <div className="form-step"><span className="step-number">01</span><div><h3>Start with your website</h3><p>Give us one URL and we’ll prepare the campaign brief for you.</p></div></div>
      <div className="website-autofill-card">
        <div className="form-field full"><label className="label" htmlFor="sellerWebsiteUrl">Your business website <span className="optional">Recommended</span></label><div className="website-autofill-row"><input className="input" id="sellerWebsiteUrl" name="sellerWebsiteUrl" type="text" inputMode="url" value={websiteUrl} onChange={(event) => handleWebsiteChange(event.target.value)} onBlur={() => void autofillFromWebsite()} placeholder="https://yourbusiness.com" autoComplete="url" /><button className="button button-secondary" type="button" onClick={() => void autofillFromWebsite()} disabled={loading || !websiteUrl.trim()} aria-busy={loading}>{loading ? <Loader2 className="spin" /> : <WandSparkles />} {loading ? "Analyzing…" : "Autofill fields"}</button></div><span className="help">We’ll read the public website for your business name, services, contact details, positioning, and any stated target market.</span></div>
        {loading ? <div className="async-status" role="status"><Loader2 className="spin" /> {autofillStatus}</div> : null}
        {autofillStatus && !loading ? <div className="autofill-success" role="status"><Check size={15} /> {autofillStatus}</div> : null}
        {autofillError ? <div className="alert alert-error" role="alert">{autofillError}</div> : null}
        <div className="form-grid sender-profile-fields"><div className="form-field"><label className="label" htmlFor="sellerName">Business name <span className="optional">Editable</span></label><input className="input" id="sellerName" name="sellerName" placeholder="Your business name" /></div><div className="form-field"><label className="label" htmlFor="sellerEmail">Business email <span className="optional">Editable</span></label><input className="input" id="sellerEmail" name="sellerEmail" type="email" placeholder="hello@yourbusiness.com" /></div><div className="form-field"><label className="label" htmlFor="sellerPhone">Phone <span className="optional">Editable</span></label><input className="input" id="sellerPhone" name="sellerPhone" type="tel" placeholder="Your business phone" /></div><div className="form-field"><label className="label" htmlFor="sellerWhatsapp">WhatsApp <span className="optional">Editable</span></label><input className="input" id="sellerWhatsapp" name="sellerWhatsapp" type="text" placeholder="WhatsApp number or link" /></div><div className="form-field full"><label className="label" htmlFor="sellerAddress">Business address <span className="optional">Editable</span></label><input className="input" id="sellerAddress" name="sellerAddress" placeholder="Business address or service location" /></div></div>
      </div>
    </section>

    <section className="form-section">
      <div className="form-step"><span className="step-number">02</span><div><h3>Review your offer</h3><p>These fields are editable after autofill.</p></div></div>
      <div className="form-grid">
        <div className="form-field full"><label className="label" htmlFor="offer">Service or solution</label><textarea className="textarea" id="offer" name="offer" rows={3} placeholder="We build fast websites and improve local SEO so businesses get more qualified enquiries." required /><span className="help">Examples: websites, SEO, digital marketing, branding, software, consulting, or advertising.</span></div>
        <div className="form-field"><label className="label" htmlFor="name">Campaign name</label><input className="input" id="name" name="name" placeholder="e.g. Restaurants · Patna" required /></div>
        <div className="form-field"><label className="label" htmlFor="cta">Call to action <span className="optional">Optional</span></label><input className="input" id="cta" name="cta" placeholder="Open to a quick conversation next week?" /></div>
      </div>
    </section>

    <section className="form-section">
      <div className="form-step"><span className="step-number">03</span><div><h3>Review your target market</h3><p>We’ll suggest a market from your stated audience and service area.</p></div></div>
      <div className="form-grid">
        <div className="form-field"><label className="label" htmlFor="category">Business type</label><input className="input" id="category" name="category" placeholder="e.g. Restaurants, clinics, salons, gyms" required /></div>
        <div className="form-field"><label className="label" htmlFor="radiusKm">Search radius</label><select className="select" id="radiusKm" name="radiusKm" defaultValue="10"><option value="1">1 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="15">15 km</option><option value="25">25 km</option><option value="50">50 km</option></select></div>
        <div className="form-field"><label className="label" htmlFor="leadLimit">Approx. prospects</label><select className="select" id="leadLimit" name="leadLimit" defaultValue="50"><option value="10">About 10</option><option value="25">About 25</option><option value="50">About 50</option><option value="100">About 100</option><option value="200">About 200</option><option value="500">About 500</option></select><span className="help">The final count depends on matching businesses and provider availability.</span></div>
        <div className="form-field full"><label className="label" htmlFor="locations">Target location</label><div className="input-with-icon"><MapPin size={16} /><input className="input" id="locations" name="locations" placeholder="Patna, Delhi, Indiranagar Bengaluru" required /></div><span className="help">Use a city, neighborhood, or several comma-separated locations. Include the city for better India results.</span></div>
      </div>
    </section>

    <section className="form-section">
      <div className="form-step"><span className="step-number">04</span><div><h3>Review the opportunity</h3><p>AI uses your website context to make the first draft useful.</p></div></div>
      <div className="form-grid">
        <div className="form-field"><label className="label" htmlFor="targetCustomer">Ideal customer <span className="optional">Optional</span></label><textarea className="textarea" id="targetCustomer" name="targetCustomer" rows={3} placeholder="Owner-operated businesses with an established local presence." /></div>
        <div className="form-field"><label className="label" htmlFor="painPoint">Likely problem <span className="optional">Optional</span></label><textarea className="textarea" id="painPoint" name="painPoint" rows={3} placeholder="They want more demand but do not have time for consistent marketing." /></div>
        <div className="form-field full"><label className="label" htmlFor="valueProposition">What changes after they work with you? <span className="optional">Optional</span></label><textarea className="textarea" id="valueProposition" name="valueProposition" rows={2} placeholder="They get a measurable system for more qualified local customers." /></div>
      </div>
    </section>

    <details className="form-details"><summary><Sparkles size={15} /> Advanced filters and outreach voice</summary><div className="form-grid" style={{ marginTop: 18 }}><div className="form-field"><label className="label" htmlFor="minRating">Minimum rating</label><select className="select" id="minRating" name="minRating" defaultValue=""><option value="">Any rating</option><option value="4">4.0+</option><option value="4.3">4.3+</option><option value="4.5">4.5+</option><option value="4.7">4.7+</option></select></div><div className="form-field"><label className="label" htmlFor="minReviews">Minimum reviews</label><select className="select" id="minReviews" name="minReviews" defaultValue=""><option value="">Any volume</option><option value="10">10+</option><option value="25">25+</option><option value="50">50+</option><option value="100">100+</option></select></div><div className="form-field"><label className="label" htmlFor="tone">Tone</label><select className="select" id="tone" name="tone" defaultValue="Warm, direct, and helpful"><option>Warm, direct, and helpful</option><option>Concise and professional</option><option>Casual and conversational</option><option>Insightful and consultative</option></select></div><div className="form-field full"><div className="checkbox-grid"><label className="check-card"><input type="checkbox" name="websiteRequired" /> Website detected</label><label className="check-card"><input type="checkbox" name="whatsappRequired" /> WhatsApp available</label><label className="check-card"><input type="checkbox" name="socialRequired" /> Social profile found</label></div></div></div></details>

    <div className="form-flow-note"><Target size={16} /><span>Your campaign will automatically start its first discovery job after you save it.</span></div>
    {submitError ? <div className="alert alert-error" role="alert">{submitError}</div> : null}
    <div className="actions" style={{ justifyContent: "flex-start", paddingTop: 22 }}><button className="button button-primary" type="submit" disabled={loading || submitting} aria-busy={submitting}>{submitting ? <Loader2 className="spin" /> : <Check />}{submitting ? "Saving campaign…" : <>Save and find prospects <ArrowRight /></>}</button><Link href="/campaigns" className="button button-secondary">Cancel</Link></div>
  </form>;
}
