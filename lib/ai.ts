/* eslint-disable @typescript-eslint/no-explicit-any */

import OpenAI from "openai";
import { z } from "zod";

import type { Campaign, Lead, LeadIntelligence, OutreachChannel, ResearchCandidate } from "./types";

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
