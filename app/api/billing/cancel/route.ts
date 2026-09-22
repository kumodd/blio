import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { cancelBillingSubscription } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await request.json().catch(() => ({}));
    const cancelAtCycleEnd = payload?.cancelAtCycleEnd !== false;
    const subscription = await cancelBillingSubscription(user.id, cancelAtCycleEnd);
    return NextResponse.json({ subscription });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not cancel subscription." }, { status: 500 });
  }
}
