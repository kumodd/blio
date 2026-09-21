"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { clearDemoSession, getCurrentUser } from "@/lib/auth";
import { archiveCampaign, createCampaign, getCampaign, updateCampaign } from "@/lib/data";
import { normalizeWebsiteUrl, scrapeSellerWebsite } from "@/lib/research/website";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CampaignContext, SellerProfile } from "@/lib/types";

const optionalNumber = (message: string, max: number) => z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.coerce.number().min(0, message).max(max, message).optional());
const optionalWebsiteUrl = z.preprocess((value) => value === "" || value === undefined ? undefined : String(value).trim(), z.string().max(500).refine((value) => /^(?:https?:\/\/)?[a-z0-9][a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(value), "Enter a valid public website URL.").optional());
const optionalSellerProfileJson = z.preprocess((value) => value === "" || value === undefined ? undefined : String(value), z.string().max(30_000).optional());
const sellerProfileInputSchema = z.object({
  websiteUrl: z.string().max(500),
  name: z.string().max(300).optional(),
  description: z.string().max(5_000).optional(),
  phone: z.string().max(100).optional(),
  whatsapp: z.string().max(500).optional(),
  email: z.string().max(300).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(200).optional(),
  services: z.array(z.string().max(300)).max(20).optional(),
  socialLinks: z.array(z.object({ type: z.enum(["instagram", "facebook", "linkedin", "youtube"]), value: z.string().max(500) })).max(20).optional(),
  sourceUrl: z.string().max(500).optional(),
  scrapedAt: z.string().max(100).optional(),
});

const campaignSchema = z.object({
  name: z.string().trim().min(2, "Give your campaign a name."),
  category: z.string().trim().min(2, "Choose a business type."),
  locations: z.string().trim().min(2, "Add at least one target location."),
  radiusKm: z.coerce.number().min(1, "Choose a search radius.").max(100, "Use a radius of 100 km or less."),
  leadLimit: z.coerce.number().int().min(5, "Choose at least 5 prospects.").max(500, "Choose 500 prospects or fewer."),
  offer: z.string().trim().min(10, "Describe the service you sell in a little more detail."),
  sellerWebsiteUrl: optionalWebsiteUrl,
  sellerProfileJson: optionalSellerProfileJson,
  sellerProfileEditor: z.enum(["1", "edit"]).optional(),
  sellerName: z.string().trim().max(300).optional().default(""),
  sellerPhone: z.string().trim().max(100).optional().default(""),
  sellerWhatsapp: z.string().trim().max(500).optional().default(""),
  sellerEmail: z.string().trim().max(300).optional().default(""),
  sellerAddress: z.string().trim().max(500).optional().default(""),
  targetCustomer: z.string().trim().optional().default(""),
  painPoint: z.string().trim().optional().default(""),
  valueProposition: z.string().trim().optional().default(""),
  cta: z.string().trim().optional().default(""),
  tone: z.string().trim().optional().default("Warm, direct, and helpful"),
  minRating: optionalNumber("Use a rating between 0 and 5.", 5),
  minReviews: optionalNumber("Use a positive review count.", 1000000),
});

function submittedSellerProfile(raw: string | undefined, websiteUrl: string | undefined) {
  if (!raw || !websiteUrl) return undefined;
  try {
    const parsed = sellerProfileInputSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return undefined;
    const submittedUrl = new URL(normalizeWebsiteUrl(parsed.data.websiteUrl) ?? parsed.data.websiteUrl);
    const requestedUrl = new URL(normalizeWebsiteUrl(websiteUrl) ?? websiteUrl);
    const normalizeHost = (host: string) => host.toLowerCase().replace(/^www\./, "");
    if (normalizeHost(submittedUrl.hostname) !== normalizeHost(requestedUrl.hostname)) return undefined;
    return parsed.data as SellerProfile;
  } catch {
    return undefined;
  }
}

async function campaignContext(value: z.infer<typeof campaignSchema>, existingContext?: { sellerProfile?: CampaignContext["sellerProfile"] }) {
  let requestedWebsite: string | undefined;
  try {
    requestedWebsite = value.sellerWebsiteUrl ? normalizeWebsiteUrl(value.sellerWebsiteUrl) : undefined;
  } catch {
    requestedWebsite = undefined;
  }
  const existingWebsite = existingContext?.sellerProfile?.websiteUrl;
  const submittedProfile = submittedSellerProfile(value.sellerProfileJson, value.sellerWebsiteUrl);
  const profile = submittedProfile ?? (requestedWebsite && requestedWebsite === existingWebsite ? existingContext?.sellerProfile : await scrapeSellerWebsite(value.sellerWebsiteUrl));
  const applyAllSellerFields = value.sellerProfileEditor === "edit" || Boolean(submittedProfile);
  const sellerProfile = profile && value.sellerProfileEditor ? {
    ...profile,
    ...(applyAllSellerFields || value.sellerName ? { name: value.sellerName || undefined } : {}),
    ...(applyAllSellerFields || value.sellerPhone ? { phone: value.sellerPhone || undefined } : {}),
    ...(applyAllSellerFields || value.sellerWhatsapp ? { whatsapp: value.sellerWhatsapp || undefined } : {}),
    ...(applyAllSellerFields || value.sellerEmail ? { email: value.sellerEmail || undefined } : {}),
    ...(applyAllSellerFields || value.sellerAddress ? { address: value.sellerAddress || undefined } : {}),
  } : profile;
  return {
    offer: value.offer,
    targetCustomer: value.targetCustomer || `Owners and decision makers at ${value.category} businesses.`,
    painPoint: value.painPoint || "They need a clearer way to attract and convert more local customers.",
    valueProposition: value.valueProposition || value.offer,
    cta: value.cta || "Open to a quick conversation next week?",
    tone: value.tone || "Warm, direct, and helpful",
    ...(sellerProfile ? { sellerProfile } : {}),
  };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  await clearDemoSession();
  redirect("/login");
}

export async function createCampaignAction(formData: FormData) {
  const values = campaignSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!values.success) {
    redirect(`/campaigns/new?error=${encodeURIComponent(values.error.issues[0]?.message ?? "Please check the form.")}`);
  }
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const value = values.data;
  const campaign = await createCampaign(user.id, {
    name: value.name,
    category: value.category,
    locations: value.locations.split(",").map((location) => location.trim()).filter(Boolean),
    radiusKm: value.radiusKm,
    leadLimit: value.leadLimit,
    context: await campaignContext(value),
    filters: { minRating: value.minRating || undefined, minReviews: value.minReviews || undefined, websiteRequired: formData.get("websiteRequired") === "on", whatsappRequired: formData.get("whatsappRequired") === "on", socialRequired: formData.get("socialRequired") === "on" },
  });
  revalidatePath("/dashboard");
  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}?autostart=1`);
}

export async function updateCampaignAction(formData: FormData) {
  const values = campaignSchema.safeParse(Object.fromEntries(formData.entries()));
  const id = String(formData.get("id") ?? "");
  if (!values.success || !id) redirect(`/campaigns/${id}/edit?error=${encodeURIComponent(values.success ? "Campaign not found." : values.error.issues[0]?.message ?? "Please check the form.")}`);
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const value = values.data;
  const current = await getCampaign(user.id, id);
  if (!current) redirect("/campaigns");
  const campaign = await updateCampaign(user.id, id, {
    name: value.name,
    category: value.category,
    locations: value.locations.split(",").map((location) => location.trim()).filter(Boolean),
    radiusKm: value.radiusKm,
    leadLimit: value.leadLimit,
    context: await campaignContext(value, current.context),
    filters: { minRating: value.minRating || undefined, minReviews: value.minReviews || undefined, websiteRequired: formData.get("websiteRequired") === "on", whatsappRequired: formData.get("whatsappRequired") === "on", socialRequired: formData.get("socialRequired") === "on" },
  });
  if (!campaign) redirect("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  revalidatePath(`/campaigns/${id}/leads`);
  revalidatePath("/campaigns");
  redirect(`/campaigns/${id}`);
}

export async function archiveCampaignAction(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  if (!user || !id) redirect("/campaigns");
  await archiveCampaign(user.id, id);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  redirect("/campaigns");
}
