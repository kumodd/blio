import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";

import type { JobStatus, LeadStatus } from "@/lib/types";
import { cn, statusLabel } from "@/lib/utils";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={cn("status", `status-${status}`)}>{statusLabel(status)}</span>;
}

export function JobStatusIcon({ status }: { status: JobStatus }) {
  if (status === "complete") return <CheckCircle2 />;
  if (status === "failed") return <CircleAlert />;
  return <Clock3 />;
}

export function Score({ value }: { value: number }) {
  const className = value < 70 ? "score-low" : value < 85 ? "score-mid" : "";
  return <span className={cn("score", className)}><i className="score-dot" />{value}</span>;
}
