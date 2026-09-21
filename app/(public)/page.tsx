import Link from "next/link";
import { ArrowRight, BrainCircuit, Building2, MessageSquareText, Search, Sparkles, Target } from "lucide-react";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <div className="landing-page">
    <section className="landing-hero">
      <div className="landing-hero-copy">
        <p className="eyebrow">AI sales prospecting for local businesses</p>
        <h1>Find the businesses that need your service next.</h1>
        <p className="landing-lead">Tell blio what you sell, who you want to reach, and where. It finds matching businesses, explains why they may need help, and gives you a relevant reason to start the conversation.</p>
        <div className="actions"><Link className="button button-primary" href="/login">Find my target clients <ArrowRight /></Link><Link className="button button-secondary" href="/about">See how it works</Link></div>
        <div className="landing-trust"><span><Building2 size={14} /> Any local business</span><span><Target size={14} /> Any service offer</span><span><Sparkles size={14} /> AI-guided research</span></div>
      </div>
      <div className="landing-orbit" aria-label="Example target market and opportunity score">
        <div className="landing-market-label">Target market</div>
        <div className="landing-market">Patna · 10 km · Restaurants</div>
        <div className="landing-orbit-card"><span className="landing-orbit-score">87</span><span>opportunity score</span><strong>Business ABC</strong><small>Outdated website · weak visibility · 823 reviews</small><div className="landing-orbit-action">Generate outreach <ArrowRight size={13} /></div></div>
      </div>
    </section>

    <section className="landing-proof"><div><strong>01</strong><span>Choose your market</span><small>Location, radius, and business type</small></div><div><strong>02</strong><span>See who needs you</span><small>Evidence-backed opportunity signals</small></div><div><strong>03</strong><span>Start better conversations</span><small>Personalized outreach you can edit</small></div></section>

    <section className="landing-section"><p className="eyebrow">How you find target clients</p><h2>Go from “I sell SEO” to “these businesses need SEO.”</h2><p className="landing-section-lead">Generic lead lists tell you who exists. blio helps you understand who is worth contacting, what may be holding them back, and how your service can create value.</p><div className="landing-grid"><article><Search /><span>01</span><h3>Discover your market</h3><p>Choose a city, radius, business type, and approximate number of prospects to build a focused search.</p></article><article><BrainCircuit /><span>02</span><h3>Understand the fit</h3><p>AI enriches public business information and turns scattered signals into a useful prospect brief.</p></article><article><Target /><span>03</span><h3>Prioritize opportunity</h3><p>Opportunity scores and highlights show where your offer is most relevant, so your time goes further.</p></article><article><MessageSquareText /><span>04</span><h3>Reach out with context</h3><p>Generate editable email, WhatsApp, Instagram, SMS, and call drafts grounded in each prospect.</p></article></div></section>

    <section className="landing-outcome"><div className="landing-outcome-copy"><p className="eyebrow">The sales outcome</p><h2>More relevant first touches. Less cold-list guesswork.</h2><p>Instead of opening a spreadsheet and wondering where to begin, you get a ranked queue of businesses with a reason to contact them. Review the evidence, personalize the draft, and move the prospect through your pipeline.</p><Link className="text-link" href="/about">Explore the complete workflow <ArrowRight size={14} /></Link></div><div className="landing-outcome-card"><div className="landing-outcome-card-top"><span>AI prospect brief</span><strong>Business ABC</strong></div><div className="landing-outcome-score"><span>Opportunity score</span><strong>87 / 100</strong></div><div className="landing-outcome-list"><span>Outdated website</span><span>High customer demand</span><span>Strong service relevance</span></div><div className="landing-outcome-cta">Generate a useful first message <ArrowRight size={13} /></div></div></section>

    <section className="landing-bottom"><div><p className="eyebrow">Your next client is already visible</p><h2>Find the signal. Start the conversation.</h2><p>Websites, SEO, marketing, branding, software, consulting, advertising, and more—blio helps you sell any service to any local business.</p></div><Link className="button landing-bottom-button" href="/login">Build my target market <ArrowRight /></Link></section>
  </div>;
}
