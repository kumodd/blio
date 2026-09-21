import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { JobMonitor } from "@/components/job-monitor";
import { getCurrentUser } from "@/lib/auth";
import { getResearchJob } from "@/lib/data";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const job = await getResearchJob(user.id, id);
  if (!job) return <div className="empty-state"><h3>Research job not found</h3><Link href="/dashboard" className="button button-primary">Back to dashboard</Link></div>;
  return <><Link className="back-link" href={`/campaigns/${job.campaignId}`}><ArrowLeft size={14} /> Back to campaign</Link><JobMonitor initialJob={job} /></>;
}
