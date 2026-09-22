import type { Metadata } from "next";
import { Check, CreditCard, ShieldCheck } from "lucide-react";

import { BillingCancelButton } from "@/components/billing-cancel-button";
import { BillingCheckout } from "@/components/billing-checkout";
import { getCurrentUser } from "@/lib/auth";
import { billingPlans, getBillingSubscription, hasPaidAccess, isRazorpayConfigured } from "@/lib/billing";
import { isDemoMode } from "@/lib/config";

export const metadata: Metadata = { title: "Billing" };

function statusLabel(status?: string) {
  if (!status) return "Starter plan";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const subscription = await getBillingSubscription(user.id);
  const active = hasPaidAccess(subscription);
  const growth = billingPlans.growth;
  return <><div className="topbar"><div><p className="eyebrow">Workspace</p><h1>Billing</h1><p className="subtitle">Choose the plan that matches how often you prospect and follow up.</p></div><CreditCard color="var(--forest)" /></div>{isDemoMode() ? <div className="alert alert-info">Billing is available in Supabase mode. Demo mode does not create real subscriptions.</div> : null}<section className="billing-summary card"><div><p className="eyebrow">Current plan</p><h2>{active ? "Growth" : "Starter"}</h2><p>{active ? "Your Growth subscription is connected to this workspace." : "Start free and upgrade when you need more prospecting capacity."}</p>{subscription ? <div className="billing-status"><span className={`status status-${subscription.status}`}>{statusLabel(subscription.status)}</span>{subscription.cancelAtCycleEnd ? <span className="help">Renewal cancelled at cycle end</span> : null}{subscription.currentEnd ? <span className="help">Current period ends {new Date(subscription.currentEnd).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span> : null}</div> : null}</div>{active ? <BillingCancelButton /> : <ShieldCheck color="var(--forest)" size={25} />}</section><section className="billing-plan-grid"><article className="billing-plan card"><div><p className="eyebrow">Included</p><h2>Starter</h2><p>For trying a focused market and building your first prospect list.</p></div><strong className="billing-price">Free</strong><ul><li><Check size={15} />1 active campaign</li><li><Check size={15} />Up to 50 prospects per run</li><li><Check size={15} />AI opportunity briefs</li><li><Check size={15} />Editable outreach drafts</li></ul><span className="billing-plan-note">Available to every workspace</span></article><article className="billing-plan billing-plan-featured card"><span className="pricing-badge">Most useful for growth</span><div><p className="eyebrow">Paid plan</p><h2>{growth.name}</h2><p>{growth.description}</p></div><strong className="billing-price">{growth.price}<small> / month</small></strong><ul>{growth.features.map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul><BillingCheckout email={user.email} configured={isRazorpayConfigured()} active={active} /></article></section><p className="billing-footnote">Test mode only: no real money is charged while you use Razorpay test credentials. Review the <a className="text-link" href="/refund-cancellation">refund and cancellation policy</a> before enabling live billing.</p></>;
}
