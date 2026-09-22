import { getCampaign, getResearchJob, insertResearchLead, updateResearchJob } from "../data";
import { enhanceCandidatesWithAI } from "../ai";
import type { ResearchDiagnostic } from "../types";
import { deduplicateCandidates } from "./identity";
import { discoverBusinesses, filterFailureCodes } from "./provider";

const filterLabels: Record<string, string> = {
  "min-rating": "minimum rating",
  "min-reviews": "minimum review count",
  website: "website requirement",
  whatsapp: "WhatsApp requirement",
  social: "social profile requirement",
};

export async function runResearchJob(userId: string, jobId: string) {
  const job = await getResearchJob(userId, jobId);
  if (!job) throw new Error("Research job not found");
  const campaign = await getCampaign(userId, job.campaignId);
  if (!campaign) throw new Error("Campaign not found");

  await updateResearchJob(userId, jobId, { status: "running", progress: 2, startedAt: new Date().toISOString(), error: undefined });
  try {
    const discovery = await discoverBusinesses(campaign);
    const diagnostics: ResearchDiagnostic[] = [];
    const deduplicated = deduplicateCandidates(discovery.candidates);
    if (deduplicated.duplicateCount > 0) {
      diagnostics.push({ code: "duplicates-removed", severity: "info", message: `${deduplicated.duplicateCount} repeated business record${deduplicated.duplicateCount === 1 ? " was" : "s were"} removed before scoring.`, count: deduplicated.duplicateCount });
    }
    if (!discovery.rawCount) {
      diagnostics.push({ code: "no-provider-results", severity: "warning", message: "No businesses were found for this category and location. Try a broader business type, location, or radius." });
    } else if (!discovery.normalizedCount) {
      diagnostics.push({ code: "normalization-empty", severity: "warning", message: `The search returned ${discovery.rawCount} record${discovery.rawCount === 1 ? "" : "s"}, but none contained the minimum business name and address fields required by QuickLeads.`, count: discovery.rawCount });
    } else if (discovery.normalizedCount < discovery.rawCount) {
      diagnostics.push({ code: "normalization-loss", severity: "info", message: `${discovery.rawCount - discovery.normalizedCount} search record${discovery.rawCount - discovery.normalizedCount === 1 ? " was" : "s were"} skipped because required business identity fields were missing.`, count: discovery.rawCount - discovery.normalizedCount });
    }

    const filterCounts = new Map<string, number>();
    const strictCandidates = deduplicated.candidates.filter((candidate) => {
      const failures = filterFailureCodes(candidate, campaign);
      failures.forEach((failure) => filterCounts.set(failure, (filterCounts.get(failure) ?? 0) + 1));
      return failures.length === 0;
    });
    let candidates = strictCandidates;
    const filteredOutCount = deduplicated.candidates.length - strictCandidates.length;

    // Missing contact enrichment is an unknown, not proof that a business has
    // no WhatsApp/social profile. If contact filters would erase the whole
    // result set, retain candidates that satisfy objective business filters and
    // explain the limitation in the job evidence. Website/rating/review rules
    // remain strict, so this cannot create a lead that violates those filters.
    if (!candidates.length && deduplicated.candidates.length && (campaign.filters.whatsappRequired || campaign.filters.socialRequired)) {
      const contactSafeCandidates = deduplicated.candidates.filter((candidate) => filterFailureCodes(candidate, campaign, { includeContactFilters: false }).length === 0);
      if (contactSafeCandidates.length) {
        candidates = contactSafeCandidates;
        diagnostics.push({ code: "contact-filter-fallback", severity: "warning", message: `No businesses had verifiable ${campaign.filters.whatsappRequired && campaign.filters.socialRequired ? "WhatsApp and social profile data" : campaign.filters.whatsappRequired ? "WhatsApp data" : "social profile data"} in the search response. Showing ${contactSafeCandidates.length} otherwise matching prospect${contactSafeCandidates.length === 1 ? "" : "s"}; verify the contact channel before outreach.`, count: contactSafeCandidates.length });
      }
    }

    for (const [code, count] of filterCounts) {
      if (count > 0) diagnostics.push({ code: `filter-${code}`, severity: "info", message: `${count} business${count === 1 ? " did not meet" : "es did not meet"} the ${filterLabels[code] ?? code}.`, count });
    }

    candidates = candidates.slice(0, campaign.leadLimit ?? 50);
    await updateResearchJob(userId, jobId, {
      discoveredCount: deduplicated.candidates.length,
      filteredOutCount,
      diagnostics,
      totalFound: candidates.length,
      totalProcessed: 0,
      progress: candidates.length ? 12 : 100,
    });
    const intelligence = await enhanceCandidatesWithAI(campaign, candidates);
    await updateResearchJob(userId, jobId, {
      discoveredCount: deduplicated.candidates.length,
      filteredOutCount,
      diagnostics,
      totalFound: candidates.length,
      totalProcessed: 0,
      progress: candidates.length ? 35 : 100,
    });
    const insertConcurrency = 5;
    for (let start = 0; start < candidates.length; start += insertConcurrency) {
      const batch = candidates.slice(start, start + insertConcurrency);
      await Promise.all(batch.map((candidate, offset) => insertResearchLead(userId, campaign.id, candidate, start + offset, intelligence.get(candidate.providerId))));
      const processed = Math.min(start + batch.length, candidates.length);
      await updateResearchJob(userId, jobId, {
        discoveredCount: deduplicated.candidates.length,
        filteredOutCount,
        diagnostics,
        totalFound: candidates.length,
        totalProcessed: processed,
        progress: Math.min(99, 35 + Math.round((processed / candidates.length) * 64)),
      });
    }
    if (!candidates.length && deduplicated.candidates.length) {
      diagnostics.push({ code: "all-candidates-filtered", severity: "warning", message: "All discovered businesses were excluded by the selected filters. No leads were saved. Review the filter evidence above and run the campaign again with fewer restrictions." });
    }
    return updateResearchJob(userId, jobId, { status: "complete", progress: 100, discoveredCount: deduplicated.candidates.length, filteredOutCount, diagnostics, totalFound: candidates.length, totalProcessed: candidates.length, completedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Research job failed:", error);
    await updateResearchJob(userId, jobId, { status: "failed", error: "Research could not be completed. Review your campaign settings and try again.", diagnostics: [{ code: "research-failed", severity: "warning", message: "The research process stopped before leads could be saved. Review your campaign settings and try again." }], completedAt: new Date().toISOString() });
    throw error;
  }
}
