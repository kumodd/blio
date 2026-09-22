import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple early-access pricing for QuickLeads AI prospecting and outreach.",
};

const plans = [
  {
    name: "Starter",
    description: "For trying a focused market and building your first prospect list.",
    price: "Free",
    detail: "Early access",
    features: ["1 active campaign", "Up to 50 prospects per run", "AI opportunity briefs", "Editable outreach drafts", "Basic pipeline tracking"],
    featured: false,
  },
  {
    name: "Growth",
    description: "For agencies and service businesses running prospecting every week.",
    price: "₹1,999",
    detail: "per month",
    features: ["10 active campaigns", "Up to 500 prospects per month", "Website and contact enrichment", "AI prospect analysis", "Priority research runs", "Exportable lead data"],
    featured: true,
  },
  {
    name: "Scale",
    description: "For teams that need larger markets, shared workflows, and support.",
    price: "Custom",
    detail: "Talk to us",
    features: ["Higher prospect volumes", "Multi-user workspace", "Custom qualification workflows", "Team pipeline reporting", "Implementation support"],
    featured: false,
  },
];

export default function PricingPage() {
  return <div className="pricing-page"><section className="public-hero pricing-hero"><p className="eyebrow">Pricing</p><h1>Start focused. Scale when your pipeline earns it.</h1><p className="public-lead">Use QuickLeads to find, understand, and prioritize target clients before you commit to a larger sales workflow.</p><div className="pricing-note"><Sparkles size={16} /><span>Growth checkout is available in test mode for invited workspaces. No real money is charged with Razorpay test credentials.</span></div></section><section className="pricing-grid" aria-label="Pricing plans">{plans.map((plan) => <article className={`pricing-card ${plan.featured ? "pricing-card-featured" : ""}`} key={plan.name}>{plan.featured ? <span className="pricing-badge">Most useful for growth</span> : null}<div className="pricing-card-top"><div><h2>{plan.name}</h2><p>{plan.description}</p></div></div><div className="pricing-price"><strong>{plan.price}</strong><span>{plan.detail}</span></div><ul>{plan.features.map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul><Link className={`button ${plan.featured ? "button-primary" : "button-secondary"}`} href={plan.name === "Scale" ? "/contact" : plan.name === "Growth" ? "/login?next=%2Fbilling" : "/login"}>{plan.name === "Scale" ? "Talk to us" : plan.name === "Growth" ? "Choose Growth" : "Start with QuickLeads"} <ArrowRight /></Link></article>)}</section><section className="public-callout pricing-callout"><div><p className="eyebrow">Clear billing controls</p><h2>Upgrade when your sales workflow is ready.</h2><p>Manage your subscription from the Billing page, cancel renewal at the end of the current billing cycle, and review the applicable refund terms before live billing.</p></div><Link className="button button-secondary" href="/refund-cancellation">Read billing policy <ArrowRight /></Link></section></div>;
}
