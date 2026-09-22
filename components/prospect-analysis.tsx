"use client";

import { CircleAlert, CircleHelp, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useState } from "react";

import type { ProspectAnalysis } from "@/lib/types";

export function ProspectAnalysisPanel({ leadId }: { leadId: string }) {
  const [analysis, setAnalysis] = useState<ProspectAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/leads/${leadId}/analysis`, { method: "POST" });
      const payload = await response.json().catch(() => null) as { analysis?: ProspectAnalysis; error?: string } | null;
      if (!response.ok || !payload?.analysis) throw new Error(payload?.error ?? "Could not analyze this prospect.");
      setAnalysis(payload.analysis);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not analyze this prospect.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="prospect-analysis" aria-busy={loading}>
    <div className="prospect-analysis-header">
      <div><p className="eyebrow">Sales intelligence gap check</p><h2>What should you learn next?</h2><p>Compare the prospect’s known facts with what you still need to qualify the opportunity.</p></div>
      <button className="button button-secondary prospect-analysis-button" type="button" onClick={runAnalysis} disabled={loading}>{loading ? <Loader2 className="spin" /> : <Sparkles />} {loading ? "Analyzing…" : analysis ? "Run again" : "Analyze missing info"}</button>
    </div>
    {error ? <div className="inline-error" role="alert"><CircleAlert /> {error}</div> : null}
    {analysis ? <div className="prospect-analysis-result">
      <div className="prospect-analysis-summary"><Sparkles /><p>{analysis.summary}</p></div>
      <div className="prospect-next-action"><span><MessageCircleQuestion size={14} /> Next best action</span><p>{analysis.nextBestAction}</p></div>
      <div className="analysis-gap-list">{analysis.missingInformation.map((gap) => <div className="analysis-gap" key={`${gap.label}-${gap.priority}`}><div className="analysis-gap-top"><strong>{gap.label}</strong><span className={`analysis-priority analysis-priority-${gap.priority}`}>{gap.priority} priority</span></div><p><b>Why it matters:</b> {gap.whyItMatters}</p><p><b>How to find it:</b> {gap.howToFind}</p></div>)}</div>
      <div className="analysis-questions"><h3><CircleHelp size={15} /> Discovery questions</h3><ul>{analysis.discoveryQuestions.map((question) => <li key={question}>{question}</li>)}</ul></div>
      <span className="analysis-model">Generated with {analysis.model}</span>
    </div> : <div className="prospect-analysis-empty"><Sparkles /><p>Use the public profile as a starting point, then let QuickLeads identify the questions that can turn this prospect into a qualified conversation.</p></div>}
  </section>;
}
