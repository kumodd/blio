/* eslint-disable @typescript-eslint/no-explicit-any */

import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./config";
import {
  demoCreateCampaign,
  demoCreateDraft,
  demoCreateJob,
  demoGetCampaign,
  demoGetDrafts,
  demoGetJob,
  demoGetLead,
  demoGetLeads,
  demoInsertResearchLead,
  demoListCampaigns,
  demoStats,
  demoArchiveCampaign,
  demoUpdateCampaign,
  demoUpdateJob,
  demoUpdateLead,
} from "./demo-store";
import type {
  Campaign,
  CampaignContext,
  CampaignFilters,
  DashboardStats,
  Lead,
  LeadIntelligence,
  OutreachChannel,
  OutreachDraft,
  ResearchCandidate,
  ResearchJob,
} from "./types";

function mapCampaign(row: any): Campaign {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    locations: row.locations_json ?? [],
    radiusKm: Number(row.radius_km ?? 10),
    leadLimit: Number(row.lead_limit ?? 50),
    context: row.context_json ?? {},
    filters: row.filters_json ?? {},
    status: row.status ?? "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLead(row: any): Lead {
  const business = row.businesses ?? row.business ?? {};
  const contacts = Array.isArray(business.business_contacts ?? business.contacts) ? business.business_contacts ?? business.contacts : [];
  const sources = Array.isArray(business.business_sources ?? business.sources) ? business.business_sources ?? business.sources : [];
  return {
    id: row.id,
    campaignId: row.campaign_id,
    business: {
      id: business.id,
      name: business.canonical_name ?? business.name,
      category: business.category,
      address: business.address,
      city: business.city,
      lat: business.lat,
      lng: business.lng,
      imageUrl: business.image_url ?? business.imageUrl,
      photos: Array.isArray(business.photos_json ?? business.photos) ? business.photos_json ?? business.photos : [],
      phone: business.phone,
      website: business.website,
      rating: business.rating,
      reviewCount: business.review_count,
      description: business.description,
      contacts: contacts.map((contact: any) => ({
        type: contact.type,
        value: contact.value,
        label: contact.label,
        verified: contact.verified,
        source: contact.source_id,
      })),
      sources: sources.map((source: any) => ({
        id: source.id,
        provider: source.provider,
        providerId: source.provider_id,
        sourceUrl: source.source_url,
        observedAt: source.observed_at,
      })),
    },
    score: row.score ?? 0,
    reasoning: row.reasoning_json ?? [],
    signals: row.signals_json ?? [],
    status: row.status ?? "new",
    tags: row.tags_json ?? [],
    notes: row.notes,
    lastContactedAt: row.last_contacted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJob(row: any): ResearchJob {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    status: row.status,
    progress: row.progress ?? 0,
    totalFound: row.total_found ?? 0,
    totalProcessed: row.total_processed ?? 0,
    error: row.error,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

function mapDraft(row: any): OutreachDraft {
  return {
    id: row.id,
    leadId: row.lead_id,
    channel: row.channel,
    body: row.body,
    subject: row.subject,
    model: row.model,
    promptVersion: row.prompt_version,
    createdAt: row.created_at,
    editedAt: row.edited_at,
  };
}

async function clientOrDemo() {
  if (isDemoMode()) return null;
  return createSupabaseServerClient();
}

export async function listCampaigns(userId: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoListCampaigns();
  const { data, error } = await supabase.from("campaigns").select("*").eq("user_id", userId).neq("status", "archived").order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCampaign);
}

export async function getCampaign(userId: string, id: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoGetCampaign(id);
  const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCampaign(data) : undefined;
}

export async function createCampaign(userId: string, input: { name: string; category: string; locations: string[]; radiusKm: number; leadLimit: number; context: CampaignContext; filters: CampaignFilters }) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoCreateCampaign(input);
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ user_id: userId, name: input.name, category: input.category, locations_json: input.locations, radius_km: input.radiusKm, lead_limit: input.leadLimit, context_json: input.context, filters_json: input.filters })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCampaign(data);
}

export async function updateCampaign(userId: string, id: string, input: { name: string; category: string; locations: string[]; radiusKm: number; leadLimit: number; context: CampaignContext; filters: CampaignFilters }) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoUpdateCampaign(id, input);
  const current = await getCampaign(userId, id);
  if (!current) return undefined;
  const { data, error } = await supabase.from("campaigns").update({ name: input.name, category: input.category, locations_json: input.locations, radius_km: input.radiusKm, lead_limit: input.leadLimit, context_json: input.context, filters_json: input.filters }).eq("id", id).eq("user_id", userId).select("*").single();
  if (error) throw new Error(error.message);
  return mapCampaign(data);
}

export async function archiveCampaign(userId: string, id: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoArchiveCampaign(id);
  const { data, error } = await supabase.from("campaigns").update({ status: "archived" }).eq("id", id).eq("user_id", userId).select("*").single();
  if (error) throw new Error(error.message);
  return mapCampaign(data);
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await clientOrDemo();
  if (!supabase) return demoStats();
  const { data: campaigns, error: campaignError } = await supabase.from("campaigns").select("id").eq("user_id", userId).eq("status", "active");
  if (campaignError) throw new Error(campaignError.message);
  const campaignIds = (campaigns ?? []).map((item) => item.id);
  if (!campaignIds.length) return { campaigns: 0, discovered: 0, saved: 0, contacted: 0, replied: 0, meetings: 0 };
  const { data: leads, error: leadError } = await supabase.from("lead_records").select("status").in("campaign_id", campaignIds);
  if (leadError) throw new Error(leadError.message);
  const statuses = (leads ?? []).map((item) => item.status);
  return {
    campaigns: campaignIds.length,
    discovered: statuses.length,
    saved: statuses.filter((status) => status !== "new").length,
    contacted: statuses.filter((status) => ["contacted", "replied", "interested", "meeting", "proposal", "won"].includes(status)).length,
    replied: statuses.filter((status) => ["replied", "interested", "meeting", "won"].includes(status)).length,
    meetings: statuses.filter((status) => ["meeting", "won"].includes(status)).length,
  };
}

const leadSelection = "*, businesses(*, business_contacts(*), business_sources(*))";

export async function listLeads(userId: string, campaignId: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoGetLeads(campaignId);
  const campaign = await getCampaign(userId, campaignId);
  if (!campaign) return [];
  const { data, error } = await supabase.from("lead_records").select(leadSelection).eq("campaign_id", campaignId).order("score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapLead);
}

export async function getLead(userId: string, id: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoGetLead(id);
  const { data, error } = await supabase.from("lead_records").select(leadSelection).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  const campaign = await getCampaign(userId, data.campaign_id);
  return campaign ? mapLead(data) : undefined;
}

export async function updateLead(userId: string, id: string, patch: { status?: Lead["status"]; tags?: string[]; notes?: string; lastContactedAt?: string }) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoUpdateLead(id, { status: patch.status, tags: patch.tags, notes: patch.notes, lastContactedAt: patch.lastContactedAt });
  const current = await getLead(userId, id);
  if (!current) return undefined;
  const { error } = await supabase.from("lead_records").update({ status: patch.status, tags_json: patch.tags, notes: patch.notes, last_contacted_at: patch.lastContactedAt }).eq("id", id);
  if (error) throw new Error(error.message);
  return getLead(userId, id);
}

export async function createResearchJob(userId: string, campaignId: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoCreateJob(campaignId);
  const campaign = await getCampaign(userId, campaignId);
  if (!campaign) throw new Error("Campaign not found");
  const { data, error } = await supabase.from("research_jobs").insert({ campaign_id: campaignId, status: "queued", progress: 0 }).select("*").single();
  if (error) throw new Error(error.message);
  return mapJob(data);
}

export async function getResearchJob(userId: string, id: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoGetJob(id);
  const { data, error } = await supabase.from("research_jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return (await getCampaign(userId, data.campaign_id)) ? mapJob(data) : undefined;
}

export async function updateResearchJob(userId: string, id: string, patch: Partial<ResearchJob>) {
  const current = await getResearchJob(userId, id);
  if (!current) return undefined;
  const supabase = await clientOrDemo();
  if (!supabase) return demoUpdateJob(id, patch);
  const update = {
    status: patch.status,
    progress: patch.progress,
    total_found: patch.totalFound,
    total_processed: patch.totalProcessed,
    error: patch.error,
    started_at: patch.startedAt,
    completed_at: patch.completedAt,
  };
  const { data, error } = await supabase.from("research_jobs").update(update).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return mapJob(data);
}

export async function insertResearchLead(userId: string, campaignId: string, candidate: ResearchCandidate, index: number, intelligence?: LeadIntelligence) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoInsertResearchLead(campaignId, candidate, index, intelligence);
  const campaign = await getCampaign(userId, campaignId);
  if (!campaign) throw new Error("Campaign not found");
  const existingBusinessResponse = await supabase.from("businesses").select("id").eq("canonical_name", candidate.name).eq("address", candidate.address).maybeSingle();
  const businessId = existingBusinessResponse.data?.id ?? crypto.randomUUID();
  const timestamp = new Date().toISOString();
  if (!existingBusinessResponse.data) {
    const { error: businessError } = await supabase.from("businesses").insert({
      id: businessId,
      canonical_name: candidate.name,
      category: candidate.category,
      address: candidate.address,
      city: candidate.city,
      lat: candidate.lat,
      lng: candidate.lng,
      image_url: candidate.imageUrl,
      photos_json: candidate.photos ?? [],
      phone: candidate.phone,
      website: candidate.website,
      rating: candidate.rating,
      review_count: candidate.reviewCount,
      description: candidate.description,
    });
    if (businessError) throw new Error(businessError.message);
    await supabase.from("business_sources").insert({ business_id: businessId, provider: candidate.sourceProvider ?? "Discovery adapter", provider_id: candidate.providerId, source_url: candidate.sourceUrl, observed_at: timestamp });
    if (candidate.contacts?.length) {
      await supabase.from("business_contacts").insert(candidate.contacts.map((contact) => ({ business_id: businessId, type: contact.type, value: contact.value, label: contact.label, verified: contact.verified ?? false, observed_at: timestamp })));
    }
  }
  const { data: existingLead } = await supabase.from("lead_records").select("id").eq("campaign_id", campaignId).eq("business_id", businessId).maybeSingle();
  if (existingLead) return getLead(userId, existingLead.id);
  const { data, error } = await supabase
    .from("lead_records")
    .insert({
      campaign_id: campaignId,
      business_id: businessId,
      score: intelligence?.score ?? Math.max(58, 82 - index * 3),
      reasoning_json: intelligence?.reasoning ?? ["Category and target location match the campaign context.", "Public business information is available for a relevant first-touch conversation."],
      signals_json: intelligence?.signals ?? [
        { label: "Category", value: candidate.category, positive: true },
        { label: "Location", value: candidate.city ?? candidate.address, positive: true },
        { label: "Contactability", value: candidate.phone || candidate.website ? "At least one channel" : "Limited", positive: Boolean(candidate.phone || candidate.website) },
      ],
      status: "new",
      tags_json: [],
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return getLead(userId, data.id);
}

export async function listDrafts(userId: string, leadId: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoGetDrafts(leadId);
  const lead = await getLead(userId, leadId);
  if (!lead) return [];
  const { data, error } = await supabase.from("outreach_drafts").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDraft);
}

export async function createDraft(userId: string, input: Omit<OutreachDraft, "id" | "createdAt">) {
  const supabase = await clientOrDemo();
  if (!supabase) return demoCreateDraft(input);
  const lead = await getLead(userId, input.leadId);
  if (!lead) throw new Error("Lead not found");
  const { data, error } = await supabase.from("outreach_drafts").insert({ lead_id: input.leadId, channel: input.channel, body: input.body, subject: input.subject, model: input.model, prompt_version: input.promptVersion }).select("*").single();
  if (error) throw new Error(error.message);
  return mapDraft(data);
}

export function candidatesForCampaign(campaign: Campaign): ResearchCandidate[] {
  return [0, 1, 2, 3, 4, 5].map((index) => ({
    providerId: `demo-${campaign.category.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
    name: `${["The Local", "Northstar", "Goodday", "Common Ground", "The Neighbourhood", "Brightside"][index]} ${campaign.category}`,
    category: campaign.category,
    address: `${10 + index} ${["12th Main", "80 Feet Road", "Market Street"][index % 3]}, ${campaign.locations[index % campaign.locations.length] ?? "Central district"}`,
      city: campaign.locations[index % campaign.locations.length],
      lat: undefined,
      lng: undefined,
    phone: `+91 90000 ${String(12000 + index * 137).slice(-5)}`,
    website: index % 3 === 2 ? undefined : `https://example-${index + 1}.in`,
    rating: Number((4.1 + (index % 5) * 0.15).toFixed(1)),
    reviewCount: 24 + index * 19,
    description: `A local ${campaign.category.toLowerCase()} serving customers in ${campaign.locations[index % campaign.locations.length] ?? "the area"}.`,
    contacts: [{ type: "phone", value: `+91 90000 ${String(12000 + index * 137).slice(-5)}`, verified: false }],
    sourceUrl: `https://example.com/business/${index + 1}`,
  }));
}

export async function updateDraft(userId: string, draftId: string, body: string) {
  const supabase = await clientOrDemo();
  if (!supabase) return undefined;
  const { data, error } = await supabase.from("outreach_drafts").update({ body, edited_at: new Date().toISOString() }).eq("id", draftId).select("*").single();
  if (error) throw new Error(error.message);
  const lead = await getLead(userId, data.lead_id);
  return lead ? mapDraft(data) : undefined;
}

export function channelLabel(channel: OutreachChannel) {
  return { whatsapp: "WhatsApp", email: "Email", sms: "SMS", phone: "Call", website: "Website", instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube" }[channel];
}
