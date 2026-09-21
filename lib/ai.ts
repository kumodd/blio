/* eslint-disable @typescript-eslint/no-explicit-any */

import OpenAI from "openai";
import { z } from "zod";

import type { Campaign, Lead, LeadIntelligence, OutreachChannel, ProspectAnalysis, ResearchCandidate } from "./types";

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
        minItems: 1,
        maxItems: 6,
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
      discoveryQuestions: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    },
    required: ["summary", "nextBestAction", "missingInformation", "discoveryQuestions"],
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

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? new OpenAI({ apiKey }) : null;
}

async function structuredResponse<T>(name: string, instructions: string, input: string, format: any): Promise<T | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? defaultModel,
    store: false,
    instructions,
    input,
    text: { format },
  });
  if (!response.output_text) return null;
  return JSON.parse(response.output_text) as T;
}

export async function enhanceCandidatesWithAI(campaign: Campaign, candidates: ResearchCandidate[]) {
  if (!process.env.OPENAI_API_KEY || !candidates.length) return new Map<string, LeadIntelligence>();
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
    const raw = await structuredResponse("blio_lead_intelligence", "You score local business leads for a sales researcher. Use only the supplied campaign and public business facts. Never invent a fact. If evidence is missing, say so in a signal. Score fit from 0 to 100 using category, geography, review proof, contactability, and campaign context. Keep reasoning concise and evidence-traceable.", input, intelligenceFormat);
    const parsed = intelligenceSchema.safeParse(raw);
    if (!parsed.success) return new Map<string, LeadIntelligence>();
    return new Map(parsed.data.items.map((item) => [item.providerId, { score: Math.round(item.score), reasoning: item.reasoning, signals: item.signals }]));
  } catch (error) {
    console.error("OpenAI lead intelligence failed; using deterministic scoring:", error);
    return new Map<string, LeadIntelligence>();
  }
}

function fallbackProspectAnalysis(campaign: Campaign, lead: Lead): ProspectAnalysis {
  const business = lead.business;
  const hasDirectContact = business.contacts.some((contact) => ["phone", "email", "whatsapp"].includes(contact.type)) || Boolean(business.phone);
  const hasSocialContact = business.contacts.some((contact) => ["instagram", "facebook", "linkedin"].includes(contact.type));
  const missingInformation = [
    !business.website ? { label: "Current online presence", whyItMatters: "You need to confirm how the business currently attracts and converts local demand before positioning your offer.", howToFind: "Ask which online channel brings them the most enquiries and whether they have a website or booking page.", priority: "high" as const } : null,
    !hasDirectContact ? { label: "Decision-maker contact", whyItMatters: "A useful insight is harder to act on without a reliable path to the owner or person responsible for growth.", howToFind: "Ask for the best person and preferred channel during the first conversation; do not guess personal details.", priority: "high" as const } : null,
    !business.description ? { label: "Business priorities", whyItMatters: "Public listings rarely reveal the specific growth goal that makes your service timely.", howToFind: "Ask what they want more of in the next 90 days: enquiries, bookings, footfall, repeat customers, or something else.", priority: "high" as const } : null,
    business.rating === undefined || business.reviewCount === undefined ? { label: "Customer demand and reputation", whyItMatters: "Demand and reputation help you size the opportunity and tailor your recommendation.", howToFind: "Review recent customer feedback or ask what customers most often praise and complain about.", priority: "medium" as const } : null,
    !hasSocialContact ? { label: "Active marketing channels", whyItMatters: "Knowing where the business already communicates helps you avoid recommending a channel they do not use.", howToFind: "Ask which social, messaging, or referral channel they actively maintain.", priority: "low" as const } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  missingInformation.push({ label: "Timeline and decision process", whyItMatters: `Your ${campaign.context.offer.toLowerCase()} offer is easier to qualify when you know who decides and when the need becomes urgent.`, howToFind: "Ask who else is involved and whether they have a target date for improving this area.", priority: "medium" });

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
  const opener = business.description ? `I came across ${business.name} and noticed you focus on ${business.description.toLowerCase().replace(/\.$/, "")}.` : `I came across ${business.name} while looking at ${campaign.category.toLowerCase()} businesses in ${business.city ?? business.address}.`;
  const value = campaign.context.valueProposition.trim().replace(/[.!?]+$/, "");
  const valueSentence = `${value.charAt(0).toUpperCase()}${value.slice(1)}.`;
  const cta = campaign.context.cta.trim();
  if (channel === "email") return { subject: `A growth idea for ${business.name}`, body: `Hi ${business.name} team,\n\n${opener} ${valueSentence}\n\n${cta}\n\nBest,\n[Your name]` };
  if (channel === "phone") return { subject: "", body: `Hi, I’m [Your name]. I’m reaching out because ${opener.toLowerCase()} ${valueSentence} Is now a bad time for a quick question?` };
  if (channel === "sms") return { subject: "", body: `Hi ${business.name} — ${valueSentence} ${cta}` };
  if (channel === "instagram") return { subject: "", body: `Hi ${business.name} — ${valueSentence} ${cta} Happy to share a quick idea here if useful.` };
  return { subject: "", body: `Hi ${business.name} team — ${opener} ${valueSentence} ${cta} Happy to share a quick idea here if useful.` };
}

export async function generateGroundedDrafts(campaign: Campaign, lead: Lead) {
  const channels: Array<Extract<OutreachChannel, "whatsapp" | "email" | "instagram" | "sms" | "phone">> = ["email", "whatsapp", "instagram", "sms", "phone"];
  if (process.env.OPENAI_API_KEY) {
    try {
      const raw = await structuredResponse("blio_outreach_drafts", "You write concise, respectful first-touch outreach. Use only the supplied campaign context and public business evidence. Do not invent services, problems, achievements, prices, customer names, or outcomes. Do not imply a relationship that does not exist. Keep WhatsApp and Instagram under 80 words, SMS under 60 words, email under 140 words, and phone under 60 seconds. Make every draft editable and human.", JSON.stringify({
        campaign: { category: campaign.category, locations: campaign.locations, radiusKm: campaign.radiusKm, leadLimit: campaign.leadLimit, context: campaign.context },
        evidence: { business: lead.business, reasoning: lead.reasoning, signals: lead.signals },
        channels,
      }), outreachFormat);
      const parsed = outreachSchema.safeParse(raw);
      if (parsed.success) return { drafts: parsed.data.drafts, model: process.env.OPENAI_MODEL ?? defaultModel, promptVersion };
    } catch (error) {
      console.error("OpenAI outreach generation failed; using deterministic fallback:", error);
    }
  }
  return { drafts: channels.map((channel) => ({ channel, ...fallbackDraft(campaign, lead, channel) })), model: "grounded-fallback", promptVersion };
}
