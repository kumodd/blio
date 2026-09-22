import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getBillingSubscription, isRazorpayConfigured } from "@/lib/billing";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subscription = await getBillingSubscription(user.id);
  return NextResponse.json({ subscription, configured: isRazorpayConfigured() }, { headers: { "cache-control": "no-store" } });
}
