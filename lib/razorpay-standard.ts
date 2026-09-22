import { createHmac, timingSafeEqual } from "node:crypto";

import Razorpay from "razorpay";

export function isStandardRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  return { keyId, client: new Razorpay({ key_id: keyId, key_secret: keySecret }) };
}

export function verifyStandardPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_SECRET.");
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const submittedBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === submittedBuffer.length && timingSafeEqual(expectedBuffer, submittedBuffer);
}

export function razorpayErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return undefined;
  const statusCode = Number(error.statusCode);
  return Number.isInteger(statusCode) ? statusCode : undefined;
}
