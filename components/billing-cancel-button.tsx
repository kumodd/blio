"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BillingCancelButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    if (!window.confirm("Cancel renewal at the end of the current billing cycle?")) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cancelAtCycleEnd: true }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Could not cancel subscription.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not cancel subscription.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="billing-cancel"><button className="button button-danger" type="button" disabled={loading} aria-busy={loading} onClick={() => void cancel()}>{loading ? <Loader2 className="spin" /> : null}{loading ? "Cancelling…" : "Cancel renewal"}</button>{error ? <div className="inline-error" role="alert">{error}</div> : null}</div>;
}
