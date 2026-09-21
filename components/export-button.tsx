"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

export function ExportButton({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export`, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Could not export this campaign.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `prospects-${campaignId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not export this campaign.");
    } finally {
      setLoading(false);
    }
  }

  return <span className="action-with-feedback"><button className="button button-secondary" type="button" onClick={download} disabled={loading} aria-busy={loading}>{loading ? <Loader2 className="spin" /> : <Download />} {loading ? "Preparing CSV…" : "Export CSV"}</button>{error ? <small className="action-error" role="alert">{error}</small> : null}</span>;
}
