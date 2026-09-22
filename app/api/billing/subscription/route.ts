import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { billingPlans, createBillingSubscription, isRazorpayConfigured } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await request.json().catch(() => ({}));
    const plan = payload?.plan === "growth" ? "growth" : undefined;
    if (!plan) return NextResponse.json({ error: "Choose a valid billing plan." }, { status: 400 });
    if (!isRazorpayConfigured()) return NextResponse.json({ error: "Razorpay test billing is not configured yet." }, { status: 503 });
    const subscription = await createBillingSubscription(user.id, user.email, plan);
    return NextResponse.json({
      subscriptionId: subscription.providerSubscriptionId,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: billingPlans[plan],
      status: subscription.status,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start subscription." }, { status: 500 });
  }
}
