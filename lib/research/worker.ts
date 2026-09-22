import { getCampaign, getResearchJob, insertResearchLead, updateResearchJob } from "../data";
import { enhanceCandidatesWithAI } from "../ai";
import { discoverBusinesses, passesFilters } from "./provider";

export async function runResearchJob(userId: string, jobId: string) {
  const job = await getResearchJob(userId, jobId);
  if (!job) throw new Error("Research job not found");
  const campaign = await getCampaign(userId, job.campaignId);
  if (!campaign) throw new Error("Campaign not found");

  await updateResearchJob(userId, jobId, { status: "running", progress: 2, startedAt: new Date().toISOString(), error: undefined });
  try {
    const candidates = (await discoverBusinesses(campaign)).filter((candidate) => passesFilters(candidate, campaign)).slice(0, campaign.leadLimit ?? 50);
    await updateResearchJob(userId, jobId, {
      totalFound: candidates.length,
      totalProcessed: 0,
      progress: candidates.length ? 12 : 100,
    });
    const intelligence = await enhanceCandidatesWithAI(campaign, candidates);
    await updateResearchJob(userId, jobId, {
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
        totalFound: candidates.length,
        totalProcessed: processed,
        progress: Math.min(99, 35 + Math.round((processed / candidates.length) * 64)),
      });
    }
    return updateResearchJob(userId, jobId, { status: "complete", progress: 100, totalFound: candidates.length, totalProcessed: candidates.length, completedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research job failed";
    await updateResearchJob(userId, jobId, { status: "failed", error: message, completedAt: new Date().toISOString() });
    throw error;
  }
}
