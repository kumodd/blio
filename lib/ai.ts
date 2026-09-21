/* eslint-disable @typescript-eslint/no-explicit-any */

import OpenAI from "openai";
import { z } from "zod";

import type { BusinessContact, Campaign, Lead, LeadIntelligence, OutreachChannel, ProspectAnalysis, ResearchCandidate, SellerProfile } from "./types";

const promptVersion = "openai-grounded-intelligence-v1";
const defaultModel = "gpt-5-mini";

const intelligenceFormat = {
  type: "json_schema",
  name: "blio_lead_intelligence",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            providerId: { type: "string" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            reasoning: { type: "array", items: { type: "string" } },
            signals: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: { label: { type: "string" }, value: { type: "string" }, positive: { type: "boolean" } },
                required: ["label", "value", "positive"],
              },
            },
          },
          required: ["providerId", "score", "reasoning", "signals"],
        },
      },
    },
    required: ["items"],
  },
} as any;

const outreachFormat = {
  type: "json_schema",
  name: "blio_outreach_drafts",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      drafts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            channel: { type: "string", enum: ["whatsapp", "email", "instagram", "sms", "phone"] },
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["channel", "subject", "body"],
        },
      },
    },
    required: ["drafts"],
  },
} as any;

const prospectAnalysisFormat = {
  type: "json_schema",
  name: "blio_prospect_information_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      nextBestAction: { type: "string" },
      missingInformation: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            whyItMatters: { type: "string" },
            howToFind: { type: "string" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["label", "whyItMatters", "howToFind", "priority"],
        },
      },
      discoveryQuestions: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "nextBestAction", "missingInformation", "discoveryQuestions"],
  },
} as any;

const sellerProfileFormat = {
  type: "json_schema",
  name: "blio_seller_profile",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      phone: { type: "string" },
      whatsapp: { type: "string" },
      email: { type: "string" },
      address: { type: "string" },
      city: { type: "string" },
      services: { type: "array", items: { type: "string" } },
      socialLinks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { type: "string", enum: ["instagram", "facebook", "linkedin", "youtube"] },
            value: { type: "string" },
          },
          required: ["type", "value"],
        },
      },
    },
    required: ["name", "description", "phone", "whatsapp", "email", "address", "city", "services", "socialLinks"],
  },
} as any;

const intelligenceSchema = z.object({
  items: z.array(z.object({
    providerId: z.string(),
    score: z.number().min(0).max(100),
    reasoning: z.array(z.string()).min(1).max(5),
    signals: z.array(z.object({ label: z.string(), value: z.string(), positive: z.boolean() })).min(1).max(6),
  })),
});

const outreachSchema = z.object({
  drafts: z.array(z.object({ channel: z.enum(["whatsapp", "email", "instagram", "sms", "phone"]), subject: z.string(), body: z.string().min(1) })).min(1),
});

const prospectAnalysisSchema = z.object({
  summary: z.string().min(1),
  nextBestAction: z.string().min(1),
  missingInformation: z.array(z.object({ label: z.string().min(1), whyItMatters: z.string().min(1), howToFind: z.string().min(1), priority: z.enum(["high", "medium", "low"]) })).min(1).max(6),
  discoveryQuestions: z.array(z.string().min(1)).min(1).max(4),
});

const sellerProfileSchema = z.object({
  name: z.string(),
  description: z.string(),
  phone: z.string(),
  whatsapp: z.string(),
  email: z.string(),
  address: z.string(),
  city: z.string(),
  services: z.array(z.string()).max(12),
  socialLinks: z.array(z.object({ type: z.enum(["instagram", "facebook", "linkedin", "youtube"]), value: z.string() })).max(12),
});

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? new OpenAI({ apiKey, maxRetries: 1, timeout: 12_000 }) : null;
}

async function structuredResponse<T>(name: string, instructions: string, input: string, format: any, maxOutputTokens = 2400): Promise<T | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? defaultModel,
    store: false,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    text: { format },
  });
  if (response.status && response.status !== "completed") return null;
  if (!response.output_text?.trim()) return null;
  try {
    return JSON.parse(response.output_text) as T;
  } catch (error) {
    console.error(`OpenAI ${name} returned invalid JSON:`, error);
    return null;
  }
}

async function enhanceCandidateBatchWithAI(campaign: Campaign, candidates: ResearchCandidate[]) {
  if (!candidates.length) return new Map<string, LeadIntelligence>();
  const input = JSON.stringify({
    campaign: { category: campaign.category, locations: campaign.locations, radiusKm: campaign.radiusKm, leadLimit: campaign.leadLimit, context: campaign.context, filters: campaign.filters },
    businesses: candidates.map((candidate) => ({
      providerId: candidate.providerId,
      name: candidate.name,
      category: candidate.category,
      address: candidate.address,
      city: candidate.city,
      phone: candidate.phone,
      website: candidate.website,
      rating: candidate.rating,
      reviewCount: candidate.reviewCount,
      description: candidate.description,
      contacts: candidate.contacts,
    })),
  });
  try {
    const raw = await structuredResponse("blio_lead_intelligence", "You score local business leads for a sales researcher. Use only the supplied campaign and public business facts. Never invent a fact. If evidence is missing, say so in a signal. Score fit from 0 to 100 using category, geography, review proof, contactability, and campaign context. Keep reasoning concise and evidence-traceable. Return one item for each supplied providerId and do not omit a business.", input, intelligenceFormat, 2600);
    const parsed = intelligenceSchema.safeParse(raw);
    if (!parsed.success) return new Map<string, LeadIntelligence>();
    return new Map(parsed.data.items.map((item) => [item.providerId, { score: Math.round(item.score), reasoning: item.reasoning, signals: item.signals }]));
  } catch (error) {
    console.error("OpenAI lead intelligence failed; using deterministic scoring:", error);
    return new Map<string, LeadIntelligence>();
  }
}

export async function enhanceCandidatesWithAI(campaign: Campaign, candidates: ResearchCandidate[]) {
  if (!process.env.OPENAI_API_KEY || !candidates.length) return new Map<string, LeadIntelligence>();
  const results = new Map<string, LeadIntelligence>();
  const batchSize = 20;
  for (let index = 0; index < candidates.length; index += batchSize) {
    const batch = candidates.slice(index, index + batchSize);
    const result = await enhanceCandidateBatchWithAI(campaign, batch);
    result.forEach((value, key) => results.set(key, value));
  }
  return results;
}

export interface SellerWebsiteSnapshot {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: string[];
  structuredData: Record<string, string | string[]>;
}

function fallbackSellerProfile(snapshot: SellerWebsiteSnapshot): SellerProfile {
  const structured = snapshot.structuredData;
  const structuredText = (key: string) => typeof structured[key] === "string" ? structured[key] : undefined;
  const emails = [...snapshot.text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0]);
  const phones = [...snapshot.text.matchAll(/(?:\+?\d[\d\s().-]{8,}\d)/g)].map((match) => match[0].replace(/\s+/g, " ").trim());
  const linkedSocials = Array.isArray(structured.socialLinks) ? structured.socialLinks : [];
  const socialLinks = [...snapshot.links, ...linkedSocials].map((value): BusinessContact | null => {
    const lower = value.toLowerCase();
    const type = lower.includes("instagram.com") ? "instagram" : lower.includes("facebook.com") ? "facebook" : lower.includes("linkedin.com") ? "linkedin" : lower.includes("youtube.com") || lower.includes("youtu.be") ? "youtube" : undefined;
    return type ? { type, value, verified: false } : null;
  }).filter((value): value is BusinessContact => Boolean(value)).filter((value, index, all) => all.findIndex((item) => item.type === value.type && item.value === value.value) === index);
  const whatsapp = snapshot.links.find((value) => /(?:wa\.me|whatsapp\.com)/i.test(value));
  const linkedEmail = snapshot.links.find((value) => /^mailto:/i.test(value))?.replace(/^mailto:/i, "").split("?")[0];
  const linkedPhone = snapshot.links.find((value) => /^tel:/i.test(value))?.replace(/^tel:/i, "");
  return {
    websiteUrl: snapshot.url,
    name: structuredText("name") || snapshot.title.split(/[|–-]/)[0]?.trim() || undefined,
    description: structuredText("description") || snapshot.description || undefined,
    phone: structuredText("phone") || linkedPhone || phones[0],
    whatsapp,
    email: structuredText("email") || linkedEmail || emails[0],
    address: structuredText("address"),
    city: structuredText("city"),
    services: snapshot.headings.slice(0, 8),
    socialLinks,
    sourceUrl: snapshot.url,
    scrapedAt: new Date().toISOString(),
  };
}

export async function extractSellerProfileFromWebsite(snapshot: SellerWebsiteSnapshot): Promise<SellerProfile> {
  const fallback = fallbackSellerProfile(snapshot);
  if (!process.env.OPENAI_API_KEY) return fallback;
  try {
    const raw = await structuredResponse(
      "blio_seller_profile",
      "Extract a seller business profile from the supplied website snapshot. Use only the snapshot. Do not infer missing contact details, services, locations, or claims. Keep empty values empty. Extract phone, WhatsApp, email, business name, description, address, city, services, and social links only when explicitly present. This profile will be used to personalize sales outreach, so accuracy is more important than completeness.",
      JSON.stringify(snapshot),
      sellerProfileFormat,
      1200,
    );
    const parsed = sellerProfileSchema.safeParse(raw);
    if (!parsed.success) return fallback;
    const extracted = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value)));
    return {
      ...fallback,
      websiteUrl: snapshot.url,
      ...extracted,
      sourceUrl: snapshot.url,
      scrapedAt: new Date().toISOString(),
    } as SellerProfile;
  } catch (error) {
    console.error("OpenAI seller website extraction failed; using parsed website facts:", error);
    return fallback;
  }
}

function fallbackProspectAnalysis(campaign: Campaign, lead: Lead): ProspectAnalysis {
  const business = lead.business;
  const offer = campaign.context.offer || "your service";
  const hasDirectContact = business.contacts.some((contact) => ["phone", "email", "whatsapp"].includes(contact.type)) || Boolean(business.phone);
  const hasSocialContact = business.contacts.some((contact) => ["instagram", "facebook", "linkedin"].includes(contact.type));
  const missingInformation = [
    !business.website ? { label: "Current online presence", whyItMatters: "You need to confirm how the business currently attracts and converts local demand before positioning your offer.", howToFind: "Ask which online channel brings them the most enquiries and whether they have a website or booking page.", priority: "high" as const } : null,
    !hasDirectContact ? { label: "Decision-maker contact", whyItMatters: "A useful insight is harder to act on without a reliable path to the owner or person responsible for growth.", howToFind: "Ask for the best person and preferred channel during the first conversation; do not guess personal details.", priority: "high" as const } : null,
    !business.description ? { label: "Business priorities", whyItMatters: "Public listings rarely reveal the specific growth goal that makes your service timely.", howToFind: "Ask what they want more of in the next 90 days: enquiries, bookings, footfall, repeat customers, or something else.", priority: "high" as const } : null,
    business.rating === undefined || business.reviewCount === undefined ? { label: "Customer demand and reputation", whyItMatters: "Demand and reputation help you size the opportunity and tailor your recommendation.", howToFind: "Review recent customer feedback or ask what customers most often praise and complain about.", priority: "medium" as const } : null,
    !hasSocialContact ? { label: "Active marketing channels", whyItMatters: "Knowing where the business already communicates helps you avoid recommending a channel they do not use.", howToFind: "Ask which social, messaging, or referral channel they actively maintain.", priority: "low" as const } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  missingInformation.push({ label: "Timeline and decision process", whyItMatters: `Your ${offer.toLowerCase()} offer is easier to qualify when you know who decides and when the need becomes urgent.`, howToFind: "Ask who else is involved and whether they have a target date for improving this area.", priority: "medium" });

  return {
    summary: `The public profile gives you a useful starting point for ${business.name}, but the strongest sales gaps are the business's current priority, decision-maker, and timeline. Treat unknowns as conversation opportunities—not assumptions.`,
    nextBestAction: "Use a short discovery question before presenting your offer, then update the prospect notes with the answer.",
    missingInformation: missingInformation.slice(0, 6),
    discoveryQuestions: [
      `What would you most like to improve in the next 90 days?`,
      "Who usually decides on marketing or business improvement projects?",
      "What have you already tried, and what happened?",
      "Would it be useful to compare a few practical options?",
    ],
    model: "grounded-fallback",
  };
}

export async function analyzeProspectInformation(campaign: Campaign, lead: Lead): Promise<ProspectAnalysis> {
  const fallback = fallbackProspectAnalysis(campaign, lead);
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const raw = await structuredResponse(
      "blio_prospect_information_analysis",
      "You are a careful B2B sales researcher. Audit what is known and unknown about a local business using only the supplied campaign, public business facts, lead signals, reasoning, and source metadata. Suggest missing information that would materially improve qualification or personalization. Never invent facts, infer a business problem from missing data, or request sensitive personal information. Explain how a salesperson can ethically verify each gap through a public source or a normal discovery conversation. Keep the output practical and concise.",
      JSON.stringify({
        campaign: { category: campaign.category, locations: campaign.locations, radiusKm: campaign.radiusKm, context: campaign.context, filters: campaign.filters },
        prospect: {
          business: lead.business,
          opportunityScore: lead.score,
          reasoning: lead.reasoning,
          signals: lead.signals,
        },
      }),
      prospectAnalysisFormat,
    );
    const parsed = prospectAnalysisSchema.safeParse(raw);
    if (parsed.success) return { ...parsed.data, model: process.env.OPENAI_MODEL ?? defaultModel };
  } catch (error) {
    console.error("OpenAI prospect information analysis failed; using deterministic fallback:", error);
  }
  return fallback;
}

function fallbackDraft(campaign: Campaign, lead: Lead, channel: OutreachChannel) {
  const business = lead.business;
  const seller = campaign.context.sellerProfile;
  const opener = business.description ? `I came across ${business.name} and noticed you focus on ${business.description.toLowerCase().replace(/\.$/, "")}.` : `I came across ${business.name} while looking at ${campaign.category.toLowerCase()} businesses in ${business.city ?? business.address}.`;
  const value = (campaign.context.valueProposition || campaign.context.offer || "I have a practical idea that may help your business").trim().replace(/[.!?]+$/, "");
  const valueSentence = `${value.charAt(0).toUpperCase()}${value.slice(1)}.`;
  const cta = (campaign.context.cta || "Would you be open to a quick conversation?").trim();
  const sellerIntro = seller?.name ? `I’m reaching out from ${seller.name}. ` : "";
  const signature = [seller?.name ?? "[Your name]", seller?.websiteUrl, seller?.phone ? `Phone: ${seller.phone}` : "", seller?.whatsapp ? `WhatsApp: ${seller.whatsapp}` : "", seller?.email ? `Email: ${seller.email}` : ""].filter(Boolean).join("\n");
  if (channel === "email") return { subject: `A growth idea for ${business.name}`, body: `Hi ${business.name} team,\n\n${sellerIntro}${opener} ${valueSentence}\n\n${cta}\n\nBest,\n${signature}` };
  if (channel === "phone") return { subject: "", body: `Hi, I’m ${seller?.name ?? "[Your name]"}. ${sellerIntro ? `${sellerIntro} ` : ""}I’m reaching out because ${opener.toLowerCase()} ${valueSentence} Is now a bad time for a quick question?` };
  if (channel === "sms") return { subject: "", body: `Hi ${business.name} — ${valueSentence} ${cta}` };
  if (channel === "instagram") return { subject: "", body: `Hi ${business.name} — ${sellerIntro}${valueSentence} ${cta} Happy to share a quick idea here if useful.` };
  return { subject: "", body: `Hi ${business.name} team — ${sellerIntro}${opener} ${valueSentence} ${cta} Happy to share a quick idea here if useful.` };
}

export async function generateGroundedDrafts(campaign: Campaign, lead: Lead) {
  const channels: Array<Extract<OutreachChannel, "whatsapp" | "email" | "instagram" | "sms" | "phone">> = ["email", "whatsapp", "instagram", "sms", "phone"];
  if (process.env.OPENAI_API_KEY) {
    try {
      const raw = await structuredResponse("blio_outreach_drafts", "You write concise, respectful first-touch outreach. Use only the supplied campaign context, seller profile, and public business evidence. The seller profile is the sender's own verified website-derived context; use its name, services, website, and contact details only when explicitly present. Do not invent services, problems, achievements, prices, customer names, or outcomes. Do not imply a relationship that does not exist. Personalize around one concrete prospect fact and the seller's relevant value proposition. Keep WhatsApp and Instagram under 80 words, SMS under 60 words, email under 140 words, and phone under 60 seconds. Make every draft editable and human.", JSON.stringify({
        campaign: { category: campaign.category, locations: campaign.locations, radiusKm: campaign.radiusKm, leadLimit: campaign.leadLimit, context: campaign.context },
        sellerProfile: campaign.context.sellerProfile ?? null,
        evidence: { business: lead.business, reasoning: lead.reasoning, signals: lead.signals },
        channels,
      }), outreachFormat, 2200);
      const parsed = outreachSchema.safeParse(raw);
      if (parsed.success) {
        const generated = new Map(parsed.data.drafts.map((draft) => [draft.channel, draft]));
        return {
          drafts: channels.map((channel) => generated.get(channel) ?? { channel, ...fallbackDraft(campaign, lead, channel) }),
          model: process.env.OPENAI_MODEL ?? defaultModel,
          promptVersion,
        };
      }
    } catch (error) {
      console.error("OpenAI outreach generation failed; using deterministic fallback:", error);
    }
  }
  return { drafts: channels.map((channel) => ({ channel, ...fallbackDraft(campaign, lead, channel) })), model: "grounded-fallback", promptVersion };
}
