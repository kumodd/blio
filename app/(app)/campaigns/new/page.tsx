import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CampaignCreationForm } from "@/components/campaign-creation-form";

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <Link className="back-link" href="/campaigns"><ArrowLeft size={14} /> Back to campaigns</Link>
      <div className="topbar">
        <div>
          <p className="eyebrow">New prospecting campaign</p>
          <h1>Find businesses worth selling to.</h1>
          <p className="subtitle">Start with your website. BLIO prepares the offer, market, and outreach context for your review.</p>
        </div>
      </div>
      {params.error ? <div className="alert alert-error" style={{ maxWidth: 880 }}>{params.error}</div> : null}
      <CampaignCreationForm />
    </>
  );
}
