"use client";

import Script from "next/script";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: { email: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function BillingCheckout({ email, configured, active }: { email: string; configured: boolean; active: boolean }) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!configured) return <div className="billing-setup-note">Test checkout is not configured yet. Add the Razorpay test key, secret, Growth plan ID, webhook secret, and Supabase service-role key to enable billing.</div>;
  if (active) return null;

  async function startCheckout() {
    if (!window.Razorpay) {
      setError("Razorpay Checkout is still loading. Try again in a moment.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/subscription", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan: "growth" }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Could not start checkout.");
      const checkout = new window.Razorpay({
        key: payload.keyId,
        subscription_id: payload.subscriptionId,
        name: "blio",
        description: "Growth plan — AI prospecting workspace",
        prefill: { email },
        theme: { color: "#0d5c4a" },
        handler: async (payment: RazorpayResponse) => {
          try {
            const verifyResponse = await fetch("/api/billing/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payment) });
            const verifyPayload = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok) throw new Error(verifyPayload.error ?? "Payment verification failed.");
            setLoading(false);
            router.refresh();
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Payment verification failed.");
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      checkout.open();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return <div className="billing-checkout"><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} /><button className="button button-primary" type="button" disabled={!scriptReady || loading} aria-busy={loading} onClick={() => void startCheckout()}>{loading ? <Loader2 className="spin" /> : <ShieldCheck />}{loading ? "Opening checkout…" : scriptReady ? "Start Growth plan" : "Loading checkout…"}</button>{error ? <div className="inline-error" role="alert">{error}</div> : null}</div>;
}
