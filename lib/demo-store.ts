import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type {
  Campaign,
  CampaignContext,
  CampaignFilters,
  DashboardStats,
  Lead,
  OutreachDraft,
  ResearchCandidate,
  ResearchJob,
} from "./types";

const now = () => new Date().toISOString();

const defaultContext: CampaignContext = {
  offer: "AI-powered local SEO and review growth for independent practices",
  targetCustomer: "Owner-operated dental and healthcare practices",
  painPoint: "They rely on word of mouth but do not have time to consistently improve local visibility.",
  valueProposition: "We help practices generate more qualified local appointments with a simple monthly growth system.",
  cta: "Would you be open to a quick 12-minute idea exchange next week?",
  tone: "Warm, direct, and helpful",
};

const campaign: Campaign = {
  id: "campaign-dental",
  userId: "demo-user",
  name: "Dental practices · Bengaluru",
  category: "Dental clinic",
  locations: ["Indiranagar", "Koramangala", "HSR Layout"],
  radiusKm: 10,
  leadLimit: 50,
  context: defaultContext,
  filters: { minRating: 4, minReviews: 20, websiteRequired: true },
  status: "active",
  createdAt: "2026-09-12T08:30:00.000Z",
  updatedAt: "2026-09-20T11:15:00.000Z",
};

function seedLead(input: Omit<Lead, "createdAt" | "updatedAt">): Lead {
  return { ...input, createdAt: "2026-09-20T09:00:00.000Z", updatedAt: "2026-09-20T09:00:00.000Z" };
}

const leads: Lead[] = [
  seedLead({
    id: "lead-smileworks",
    campaignId: campaign.id,
    business: {
      id: "business-smileworks",
      name: "SmileWorks Dental Studio",
      category: "Dental clinic",
      address: "124 80 Feet Road, Indiranagar, Bengaluru",
      city: "Bengaluru",
      phone: "+91 80 4123 8800",
      website: "smileworksstudio.in",
      rating: 4.8,
      reviewCount: 184,
      description: "Contemporary dental studio offering preventive, cosmetic, and family dentistry.",
      contacts: [
        { type: "phone", value: "+91 80 4123 8800", verified: true },
        { type: "website", value: "https://smileworksstudio.in", verified: true },
        { type: "instagram", value: "https://instagram.com/smileworksstudio", verified: false },
      ],
      sources: [
        { provider: "Business directory", providerId: "bw_1001", sourceUrl: "https://example.com/smileworks", observedAt: "2026-09-20T09:00:00.000Z" },
        { provider: "Business website", sourceUrl: "https://smileworksstudio.in", observedAt: "2026-09-20T09:00:00.000Z" },
      ],
    },
    score: 94,
    reasoning: ["Strong review proof with 184 reviews and a 4.8 rating.", "Own website is active and positions the studio for local growth.", "Located in the primary target neighborhood: Indiranagar."],
    signals: [
      { label: "Review strength", value: "4.8 · 184 reviews", positive: true },
      { label: "Website", value: "Active site detected", positive: true },
      { label: "Local fit", value: "Indiranagar", positive: true },
    ],
    status: "new",
    tags: ["high-fit", "website"],
  }),
  seedLead({
    id: "lead-urbanroots",
    campaignId: campaign.id,
    business: {
      id: "business-urbanroots",
      name: "Urban Roots Family Dentistry",
      category: "Dental clinic",
      address: "32 1st Main, Koramangala 5th Block, Bengaluru",
      city: "Bengaluru",
      phone: "+91 98450 21876",
      website: "urbanrootsdental.com",
      rating: 4.6,
      reviewCount: 96,
      description: "Family dental practice known for gentle care, pediatric dentistry, and emergency appointments.",
      contacts: [
        { type: "phone", value: "+91 98450 21876", verified: true },
        { type: "website", value: "https://urbanrootsdental.com", verified: true },
        { type: "whatsapp", value: "+919845021876", verified: false },
      ],
      sources: [{ provider: "Business directory", providerId: "bw_1002", sourceUrl: "https://example.com/urbanroots", observedAt: "2026-09-20T09:01:00.000Z" }],
    },
    score: 88,
    reasoning: ["Family and emergency positioning suggests a high value on new patient demand.", "96 reviews indicate an established local patient base.", "WhatsApp contact path is available for a low-friction first touch."],
    signals: [
      { label: "Review strength", value: "4.6 · 96 reviews", positive: true },
      { label: "Contactability", value: "Phone + WhatsApp", positive: true },
      { label: "Local fit", value: "Koramangala", positive: true },
    ],
    status: "reviewed",
    tags: ["whatsapp", "family-practice"],
  }),
  seedLead({
    id: "lead-pearlsmile",
    campaignId: campaign.id,
    business: {
      id: "business-pearlsmile",
      name: "PearlSmile Dental Care",
      category: "Dental clinic",
      address: "8 14th Cross, HSR Layout, Bengaluru",
      city: "Bengaluru",
      phone: "+91 99000 77441",
      rating: 4.3,
      reviewCount: 41,
      description: "Neighborhood dental clinic with general and cosmetic services.",
      contacts: [{ type: "phone", value: "+91 99000 77441", verified: true }],
      sources: [{ provider: "Business directory", providerId: "bw_1003", sourceUrl: "https://example.com/pearlsmile", observedAt: "2026-09-20T09:02:00.000Z" }],
    },
    score: 74,
    reasoning: ["Target category and location match the campaign.", "Moderate review volume leaves room for a review-growth conversation.", "No website was found, so the initial message should lead with local visibility rather than site improvements."],
    signals: [
      { label: "Review strength", value: "4.3 · 41 reviews", positive: true },
      { label: "Website", value: "Not detected", positive: false },
      { label: "Local fit", value: "HSR Layout", positive: true },
    ],
    status: "new",
    tags: ["no-website"],
  }),
];

const store = {
  // Demo mode starts with an empty workspace. Optional seed data is useful for
  // screenshots, but it should never look like a user's own campaign.
  campaigns: (process.env.BLIO_DEMO_SEED_DATA ?? process.env.NEXT_PUBLIC_DEMO_SEED_DATA) === "true" ? [campaign] : [] as Campaign[],
  leads: (process.env.BLIO_DEMO_SEED_DATA ?? process.env.NEXT_PUBLIC_DEMO_SEED_DATA) === "true" ? leads : [],
  jobs: [] as ResearchJob[],
  drafts: [] as OutreachDraft[],
};

const demoStoreFile = process.env.BLIO_DEMO_DATA_FILE ?? `${process.cwd()}/.data/demo-store.json`;

function loadStore() {
  try {
    const persisted = JSON.parse(readFileSync(/* turbopackIgnore: true */ demoStoreFile, "utf8")) as Partial<typeof store>;
    if (Array.isArray(persisted.campaigns)) store.campaigns = persisted.campaigns.map((item) => ({ ...item, radiusKm: Number(item.radiusKm ?? 10), leadLimit: Number(item.leadLimit ?? 50) }));
    if (Array.isArray(persisted.leads)) {
      store.leads = persisted.leads.map((item) => ({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags : [],
        reasoning: Array.isArray(item.reasoning) ? item.reasoning : [],
        signals: Array.isArray(item.signals) ? item.signals : [],
        business: {
          ...item.business,
          contacts: Array.isArray(item.business?.contacts) ? item.business.contacts : [],
          sources: Array.isArray(item.business?.sources) ? item.business.sources : [],
        },
      }));
    }
    if (Array.isArray(persisted.jobs)) {
      store.jobs = persisted.jobs.map((item) => ({
        ...item,
        discoveredCount: Number(item.discoveredCount ?? item.totalFound ?? 0),
        filteredOutCount: Number(item.filteredOutCount ?? 0),
        diagnostics: Array.isArray(item.diagnostics) ? item.diagnostics : [],
      }));
    }
    if (Array.isArray(persisted.drafts)) store.drafts = persisted.drafts;
  } catch {
    // A missing or unreadable demo file means a fresh in-memory workspace.
  }
}

function persistStore() {
  try {
    mkdirSync(dirname(demoStoreFile), { recursive: true });
    const temporaryFile = `${demoStoreFile}.${process.pid}.tmp`;
    writeFileSync(temporaryFile, JSON.stringify(store), "utf8");
    renameSync(temporaryFile, demoStoreFile);
  } catch {
    // Demo mode remains usable on read-only hosts; persistence is best effort.
  }
}

export function demoListCampaigns() {
  loadStore();
  return store.campaigns.filter((item) => item.status !== "archived");
}

export function demoGetCampaign(id: string) {
  loadStore();
  return store.campaigns.find((item) => item.id === id);
}

export function demoUpdateCampaign(id: string, input: { name: string; category: string; locations: string[]; radiusKm: number; leadLimit: number; context: CampaignContext; filters: CampaignFilters }) {
  loadStore();
  const item = store.campaigns.find((campaignItem) => campaignItem.id === id);
  if (!item) return undefined;
  Object.assign(item, input, { updatedAt: now() });
  persistStore();
  return item;
}

export function demoArchiveCampaign(id: string) {
  loadStore();
  const item = store.campaigns.find((campaignItem) => campaignItem.id === id);
  if (!item) return undefined;
  item.status = "archived";
  item.updatedAt = now();
  persistStore();
  return item;
}

export function demoCreateCampaign(input: { name: string; category: string; locations: string[]; radiusKm: number; leadLimit: number; context: CampaignContext; filters: CampaignFilters }) {
  loadStore();
  const timestamp = now();
  const item: Campaign = {
    id: `campaign-${crypto.randomUUID()}`,
    userId: "demo-user",
    name: input.name,
    category: input.category,
    locations: input.locations,
    radiusKm: input.radiusKm,
    leadLimit: input.leadLimit,
    context: input.context,
    filters: input.filters,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.campaigns.unshift(item);
  persistStore();
  return item;
}

export function demoGetLeads(campaignId: string) {
  loadStore();
  return store.leads.filter((item) => item.campaignId === campaignId).sort((a, b) => b.score - a.score);
}

export function demoGetLead(id: string) {
  loadStore();
  return store.leads.find((item) => item.id === id);
}

export function demoUpdateLead(id: string, patch: Partial<Pick<Lead, "status" | "tags" | "notes" | "lastContactedAt">>) {
  loadStore();
  const lead = store.leads.find((item) => item.id === id);
  if (!lead) return undefined;
  Object.assign(lead, patch, { updatedAt: now() });
  persistStore();
  return lead;
}

export function demoCreateJob(campaignId: string) {
  loadStore();
  const job: ResearchJob = {
    id: `job-${crypto.randomUUID()}`,
    campaignId,
    status: "queued",
    progress: 0,
    discoveredCount: 0,
    filteredOutCount: 0,
    totalFound: 0,
    totalProcessed: 0,
    diagnostics: [],
    createdAt: now(),
  };
  store.jobs.unshift(job);
  persistStore();
  return job;
}

export function demoGetJob(id: string) {
  loadStore();
  return store.jobs.find((item) => item.id === id);
}

export function demoUpdateJob(id: string, patch: Partial<ResearchJob>) {
  loadStore();
  const job = store.jobs.find((item) => item.id === id);
  if (!job) return undefined;
  Object.assign(job, patch);
  persistStore();
  return job;
}

export function demoCreateDraft(input: Omit<OutreachDraft, "id" | "createdAt">) {
  loadStore();
  const draft: OutreachDraft = { ...input, id: `draft-${crypto.randomUUID()}`, createdAt: now() };
  store.drafts.unshift(draft);
  persistStore();
  return draft;
}

export function demoGetDrafts(leadId: string) {
  loadStore();
  return store.drafts.filter((draft) => draft.leadId === leadId);
}

export function demoStats(): DashboardStats {
  loadStore();
  return {
    campaigns: store.campaigns.filter((item) => item.status === "active").length,
    discovered: store.leads.length,
    saved: store.leads.filter((item) => item.status !== "new").length,
    contacted: store.leads.filter((item) => ["contacted", "replied", "interested", "meeting", "proposal", "won"].includes(item.status)).length,
    replied: store.leads.filter((item) => ["replied", "interested", "meeting", "won"].includes(item.status)).length,
    meetings: store.leads.filter((item) => ["meeting", "won"].includes(item.status)).length,
  };
}

export function demoInsertResearchLead(campaignId: string, candidate: ResearchCandidate, index: number, intelligence?: { score: number; reasoning: string[]; signals: { label: string; value: string; positive: boolean }[] }) {
  loadStore();
  const existing = store.leads.find((lead) => lead.campaignId === campaignId && lead.business.sources.some((source) => source.providerId === candidate.providerId));
  if (existing) return existing;
  const timestamp = now();
  const lead: Lead = {
    id: `lead-${crypto.randomUUID()}`,
    campaignId,
    business: {
      id: `business-${crypto.randomUUID()}`,
      name: candidate.name,
      category: candidate.category,
      address: candidate.address,
      city: candidate.city,
      lat: candidate.lat,
      lng: candidate.lng,
      imageUrl: candidate.imageUrl,
      photos: candidate.photos ?? [],
      phone: candidate.phone,
      website: candidate.website,
      rating: candidate.rating,
      reviewCount: candidate.reviewCount,
      description: candidate.description,
      contacts: candidate.contacts ?? (candidate.phone ? [{ type: "phone", value: candidate.phone, verified: false }] : []),
      sources: [{ provider: candidate.sourceProvider ?? "Discovery adapter", providerId: candidate.providerId, sourceUrl: candidate.sourceUrl, observedAt: timestamp }],
    },
    score: intelligence?.score ?? Math.max(58, 82 - index * 3),
    reasoning: intelligence?.reasoning ?? ["Category and target location match the campaign context.", "Public business information is available for a relevant first-touch conversation."],
    signals: intelligence?.signals ?? [
      { label: "Category", value: candidate.category, positive: true },
      { label: "Location", value: candidate.city ?? candidate.address, positive: true },
      { label: "Contactability", value: candidate.phone || candidate.website ? "At least one channel" : "Limited", positive: Boolean(candidate.phone || candidate.website) },
    ],
    status: "new",
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.leads.push(lead);
  persistStore();
  return lead;
}
