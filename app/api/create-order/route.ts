import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { getRazorpayClient, razorpayErrorStatus } from "@/lib/razorpay-standard";

const orderRequestSchema = z.object({
  amount: z.coerce.number().int().min(100, "The minimum payment amount is 100 paise."),
  currency: z.string().trim().length(3).regex(/^[a-z]+$/i, "Currency must be a three-letter code.").transform((value) => value.toUpperCase()).default("INR"),
  receipt: z.string().trim().min(1).max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const parsed = orderRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid payment amount." }, { status: 400 });

    const { keyId, client } = getRazorpayClient();
    const order = await client.orders.create({
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      receipt: parsed.data.receipt ?? `quickleads_${Date.now()}_${randomUUID().slice(0, 8)}`,
      notes: { quickleads_user_id: user.id },
    });
    return NextResponse.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId });
  } catch (error) {
    const providerStatus = razorpayErrorStatus(error);
    if (providerStatus === 401) return NextResponse.json({ error: "Razorpay authentication failed. Check the test API credentials." }, { status: 401 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create Razorpay order." }, { status: 500 });
  }
}
