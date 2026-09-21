"use client";

import { ArrowRight, CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ResearchJob } from "@/lib/types";

export function JobMonitor({ initialJob }: { initialJob: ResearchJob }) {
  const [job, setJob] = useState(initialJob);
  const [pollError, setPollError] = useState("");
  const router = useRouter();
  useEffect(() => {
    if (["complete", "failed", "cancelled"].includes(job.status)) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Status refresh failed");
        const payload = await response.json();
        if (payload.job) {
          setJob(payload.job);
          setPollError("");
        }
      } catch {
        setPollError("We could not refresh the job status. Retrying automatically.");
      }
    }, 1400);
    return () => window.clearInterval(timer);
  }, [job.id, job.status]);

  const complete = job.status === "complete";
  const failed = job.status === "failed";
  return <div className="card job-card">
    <div className="job-icon">{complete ? <CheckCircle2 /> : failed ? <CircleAlert /> : <Loader2 className="spin" />}</div>
    <p className="eyebrow">Research job</p>
    <h2>{complete ? "Your lead list is ready" : failed ? "Research needs attention" : "Finding the right businesses"}</h2>
    <p className="subtitle">{complete ? "We normalized the results and attached source context to every lead." : failed ? "The job stopped before completion. You can safely run the campaign again." : "Discovery and enrichment are running in the background. You can leave this page open."}</p>
    <div className="job-progress"><div className="job-progress-meta"><span>{job.totalProcessed} of {job.totalFound || "—"} businesses processed</span><strong>{job.progress}%</strong></div><div className="progress-track"><div className="progress-bar" style={{ width: `${job.progress}%` }} /></div></div>
    {job.error ? <div className="job-error">{job.error}</div> : null}
    {pollError ? <div className="job-poll-error" role="status">{pollError}</div> : null}
    <div className="actions" style={{ justifyContent: "center", marginTop: 22 }}>{complete ? <Link className="button button-primary" href={`/campaigns/${job.campaignId}/leads`}>Review leads <ArrowRight /></Link> : failed ? <button className="button button-secondary" type="button" onClick={() => router.refresh()}>Refresh status</button> : <span className="help job-live">This page updates automatically</span>}</div>
  </div>;
}
