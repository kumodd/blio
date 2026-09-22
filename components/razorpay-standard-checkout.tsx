"use client";

import Script from "next/script";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

type RazorpayPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayPaymentFailure = { error?: { description?: string } };

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { email: string };
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayPaymentFailure) => void) => void;
};

type StandardCheckoutWindow = Window & { Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout };

export function RazorpayStandardCheckout({ email, amount = 100, configured }: { email: string; amount?: number; configured: boolean }) {
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function startPayment() {
    const razorpayConstructor = (window as StandardCheckoutWindow).Razorpay;
    if (!razorpayConstructor) {
      setError("Razorpay Checkout is still loading. Try again in a moment.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const orderResponse = await fetch("/api/create-order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount, currency: "INR" }) });
      const orderPayload = await orderResponse.json().catch(() => ({})) as { order_id?: string; amount?: number; currency?: string; key_id?: string; error?: string };
      const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? orderPayload.key_id;
      if (!orderResponse.ok || !orderPayload.order_id || !orderPayload.amount || !orderPayload.currency || !publicKeyId) throw new Error(orderPayload.error ?? "Could not create the payment order.");

      const checkout = new razorpayConstructor({
        key: publicKeyId,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "QuickLeads",
        description: "QuickLeads Standard Checkout test payment",
        order_id: orderPayload.order_id,
        prefill: { email },
        theme: { color: "#0d5c4a" },
        handler: async (payment) => {
          try {
            const verifyResponse = await fetch("/api/verify-payment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payment) });
            const verifyPayload = await verifyResponse.json().catch(() => ({})) as { success?: boolean; error?: string };
            if (!verifyResponse.ok || !verifyPayload.success) throw new Error(verifyPayload.error ?? "Payment verification failed.");
            setMessage("Payment verified successfully.");
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      checkout.on("payment.failed", (failure) => {
        setError(failure.error?.description ?? "Payment failed. Please try again.");
        setLoading(false);
      });
      checkout.open();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start payment.");
      setLoading(false);
    }
  }

  if (!configured) return <div className="standard-checkout-card card"><p className="eyebrow">Standard Checkout</p><h2>One-time payments</h2><p className="billing-setup-note">Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable the test checkout.</p></div>;
  return <section className="standard-checkout-card card"><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} /><div><p className="eyebrow">Standard Checkout</p><h2>Test a one-time payment</h2><p>Use Razorpay’s hosted payment modal to verify order creation, checkout, and signature verification.</p></div><button className="button button-primary" type="button" onClick={() => void startPayment()} disabled={!scriptReady || loading} aria-busy={loading}>{loading ? <Loader2 className="spin" /> : message ? <CheckCircle2 /> : <CreditCard />}{loading ? "Opening checkout…" : message || `Pay ₹${(amount / 100).toFixed(2)} test amount`}</button>{error ? <div className="inline-error" role="alert">{error}</div> : null}</section>;
}
