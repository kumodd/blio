import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { verifyStandardPaymentSignature } from "@/lib/razorpay-standard";

const paymentResponseSchema = z.object({
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_order_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const parsed = paymentResponseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Payment verification fields are missing." }, { status: 400 });
    const { razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature } = parsed.data;
    if (!verifyStandardPaymentSignature(orderId, paymentId, signature)) return NextResponse.json({ error: "Razorpay payment signature verification failed." }, { status: 400 });
    return NextResponse.json({ success: true, order_id: orderId, payment_id: paymentId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify Razorpay payment." }, { status: 500 });
  }
}
