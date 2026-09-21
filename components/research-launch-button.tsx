"use client";

import { Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ResearchLaunchButton({ campaignId, compact = false, autoStart = false }: { campaignId: string; compact?: boolean; autoStart?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(autoStart);
  const [error, setError] = useState("");
  const autoStarted = useRef(false);
  const starting = useRef(false);
  const start = useCallback(async () => {
    if (starting.current) return;
    starting.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/research`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Could not start research.");
      const runResponse = await fetch(`/api/jobs/${payload.job.id}/run`, { method: "POST" });
      const runPayload = await runResponse.json().catch(() => ({}));
      if (!runResponse.ok) throw new Error(runPayload.error ?? "Could not run research.");
      router.push(`/jobs/${payload.job.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start research.");
    } finally {
      starting.current = false;
      setLoading(false);
    }
  }, [campaignId, router]);

  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    void start();
  }, [autoStart, start]);

  return <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}><button className={`button ${compact ? "button-secondary" : "button-primary"}`} onClick={start} disabled={loading} aria-busy={loading} type="button">{loading ? <Loader2 className="spin" /> : <Play />}{loading ? "Starting research…" : compact ? "Run again" : "Run research"}</button>{error ? <small style={{ color: "var(--rose-ink)" }} role="alert">{error}</small> : null}</span>;
}
