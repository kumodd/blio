import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getBillingSubscription, saveVerifiedSubscription, verifySubscriptionSignature } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await request.json().catch(() => ({}));
    const paymentId = typeof payload?.razorpay_payment_id === "string" ? payload.razorpay_payment_id : "";
    const submittedSubscriptionId = typeof payload?.razorpay_subscription_id === "string" ? payload.razorpay_subscription_id : "";
    const signature = typeof payload?.razorpay_signature === "string" ? payload.razorpay_signature : "";
    const stored = await getBillingSubscription(user.id);
    if (!stored || !paymentId || !submittedSubscriptionId || !signature || stored.providerSubscriptionId !== submittedSubscriptionId) {
      return NextResponse.json({ error: "The payment response could not be matched to your subscription." }, { status: 400 });
    }
    if (!verifySubscriptionSignature(stored.providerSubscriptionId, paymentId, signature)) {
      return NextResponse.json({ error: "Razorpay payment verification failed." }, { status: 400 });
    }
    const subscription = await saveVerifiedSubscription(user.id, stored.providerSubscriptionId, paymentId);
    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify subscription." }, { status: 500 });
  }
}
