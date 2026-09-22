import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { processRazorpayWebhook, verifyWebhookSignature } from "@/lib/billing";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  try {
    if (!verifyWebhookSignature(rawBody, signature)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    const payload = JSON.parse(rawBody);
    const eventType = typeof payload?.event === "string" ? payload.event : "unknown";
    const eventId = request.headers.get("x-razorpay-event-id") ?? createHash("sha256").update(rawBody).digest("hex");
    await processRazorpayWebhook(eventId, eventType, payload);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 500 });
  }
}
