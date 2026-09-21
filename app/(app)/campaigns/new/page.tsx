import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, MapPin, Sparkles, Target } from "lucide-react";

import { createCampaignAction } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <Link className="back-link" href="/campaigns"><ArrowLeft size={14} /> Back to campaigns</Link>
      <div className="topbar">
        <div>
          <p className="eyebrow">New prospecting campaign</p>
          <h1>Find businesses worth selling to.</h1>
          <p className="subtitle">Define your offer and target market. BLIO discovers, scores, and prepares the first conversation.</p>
        </div>
      </div>
      {params.error ? <div className="alert alert-error" style={{ maxWidth: 880 }}>{params.error}</div> : null}
      <form className="card form-card" action={createCampaignAction}>
        <section className="form-section">
          <div className="form-step"><span className="step-number">01</span><div><h3>Define your offer</h3><p>What service can you sell to any local business?</p></div></div>
          <div className="form-grid">
            <div className="form-field full"><label className="label" htmlFor="offer">Service or solution</label><textarea className="textarea" id="offer" name="offer" rows={3} placeholder="We build fast websites and improve local SEO so businesses get more qualified enquiries." required /><span className="help">Examples: websites, SEO, digital marketing, branding, software, consulting, or advertising.</span></div>
            <div className="form-field"><label className="label" htmlFor="name">Campaign name</label><input className="input" id="name" name="name" placeholder="e.g. Restaurants · Patna" required /></div>
            <div className="form-field"><label className="label" htmlFor="cta">Call to action <span className="optional">Optional</span></label><input className="input" id="cta" name="cta" placeholder="Open to a quick conversation next week?" /></div>
            <div className="form-field full"><label className="label" htmlFor="sellerWebsiteUrl">Your business website <span className="optional">Optional</span></label><input className="input" id="sellerWebsiteUrl" name="sellerWebsiteUrl" type="url" placeholder="https://yourbusiness.com" /><span className="help">We’ll read the public website to capture your business name, services, contact details, and positioning for more relevant outreach.</span></div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-step"><span className="step-number">02</span><div><h3>Define your target market</h3><p>Location → business type → search radius.</p></div></div>
          <div className="form-grid">
            <div className="form-field"><label className="label" htmlFor="category">Business type</label><input className="input" id="category" name="category" placeholder="e.g. Restaurants, clinics, salons, gyms" required /></div>
            <div className="form-field"><label className="label" htmlFor="radiusKm">Search radius</label><select className="select" id="radiusKm" name="radiusKm" defaultValue="10"><option value="1">1 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="15">15 km</option><option value="25">25 km</option><option value="50">50 km</option></select></div>
            <div className="form-field"><label className="label" htmlFor="leadLimit">Approx. prospects</label><select className="select" id="leadLimit" name="leadLimit" defaultValue="50"><option value="10">About 10</option><option value="25">About 25</option><option value="50">About 50</option><option value="100">About 100</option><option value="200">About 200</option><option value="500">About 500</option></select><span className="help">The final count depends on matching businesses and provider availability.</span></div>
            <div className="form-field full"><label className="label" htmlFor="locations">Target location</label><div className="input-with-icon"><MapPin size={16} /><input className="input" id="locations" name="locations" placeholder="Patna, Delhi, Indiranagar Bengaluru" required /></div><span className="help">Use a city, neighborhood, or several comma-separated locations. Include the city for better India results.</span></div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-step"><span className="step-number">03</span><div><h3>Describe the opportunity</h3><p>Optional context helps AI explain why each prospect matters.</p></div></div>
          <div className="form-grid">
            <div className="form-field"><label className="label" htmlFor="targetCustomer">Ideal customer <span className="optional">Optional</span></label><textarea className="textarea" id="targetCustomer" name="targetCustomer" rows={3} placeholder="Owner-operated businesses with an established local presence." /></div>
            <div className="form-field"><label className="label" htmlFor="painPoint">Likely problem <span className="optional">Optional</span></label><textarea className="textarea" id="painPoint" name="painPoint" rows={3} placeholder="They want more demand but do not have time for consistent marketing." /></div>
            <div className="form-field full"><label className="label" htmlFor="valueProposition">What changes after they work with you? <span className="optional">Optional</span></label><textarea className="textarea" id="valueProposition" name="valueProposition" rows={2} placeholder="They get a measurable system for more qualified local customers." /></div>
          </div>
        </section>

        <details className="form-details"><summary><Sparkles size={15} /> Advanced filters and outreach voice</summary><div className="form-grid" style={{ marginTop: 18 }}><div className="form-field"><label className="label" htmlFor="minRating">Minimum rating</label><select className="select" id="minRating" name="minRating" defaultValue=""><option value="">Any rating</option><option value="4">4.0+</option><option value="4.3">4.3+</option><option value="4.5">4.5+</option><option value="4.7">4.7+</option></select></div><div className="form-field"><label className="label" htmlFor="minReviews">Minimum reviews</label><select className="select" id="minReviews" name="minReviews" defaultValue=""><option value="">Any volume</option><option value="10">10+</option><option value="25">25+</option><option value="50">50+</option><option value="100">100+</option></select></div><div className="form-field"><label className="label" htmlFor="tone">Tone</label><select className="select" id="tone" name="tone" defaultValue="Warm, direct, and helpful"><option>Warm, direct, and helpful</option><option>Concise and professional</option><option>Casual and conversational</option><option>Insightful and consultative</option></select></div><div className="form-field full"><div className="checkbox-grid"><label className="check-card"><input type="checkbox" name="websiteRequired" /> Website detected</label><label className="check-card"><input type="checkbox" name="whatsappRequired" /> WhatsApp available</label><label className="check-card"><input type="checkbox" name="socialRequired" /> Social profile found</label></div></div></div></details>

        <div className="form-flow-note"><Target size={16} /><span>Your campaign will automatically start its first discovery job after you save it.</span></div>
        <div className="actions" style={{ justifyContent: "flex-start", paddingTop: 22 }}><FormSubmitButton pendingLabel="Saving campaign…"><Check /> Save and find prospects <ArrowRight /></FormSubmitButton><Link href="/campaigns" className="button button-secondary">Cancel</Link></div>
      </form>
    </>
  );
}
