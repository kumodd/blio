"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { clearDemoSession, getCurrentUser } from "@/lib/auth";
import { archiveCampaign, createCampaign, updateCampaign } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const optionalNumber = (message: string, max: number) => z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.coerce.number().min(0, message).max(max, message).optional());

const campaignSchema = z.object({
  name: z.string().trim().min(2, "Give your campaign a name."),
  category: z.string().trim().min(2, "Choose a business type."),
  locations: z.string().trim().min(2, "Add at least one target location."),
  radiusKm: z.coerce.number().min(1, "Choose a search radius.").max(100, "Use a radius of 100 km or less."),
  leadLimit: z.coerce.number().int().min(5, "Choose at least 5 prospects.").max(500, "Choose 500 prospects or fewer."),
  offer: z.string().trim().min(10, "Describe the service you sell in a little more detail."),
  targetCustomer: z.string().trim().optional().default(""),
  painPoint: z.string().trim().optional().default(""),
  valueProposition: z.string().trim().optional().default(""),
  cta: z.string().trim().optional().default(""),
  tone: z.string().trim().optional().default("Warm, direct, and helpful"),
  minRating: optionalNumber("Use a rating between 0 and 5.", 5),
  minReviews: optionalNumber("Use a positive review count.", 1000000),
});

function campaignContext(value: z.infer<typeof campaignSchema>) {
  return {
    offer: value.offer,
    targetCustomer: value.targetCustomer || `Owners and decision makers at ${value.category} businesses.`,
    painPoint: value.painPoint || "They need a clearer way to attract and convert more local customers.",
    valueProposition: value.valueProposition || value.offer,
    cta: value.cta || "Open to a quick conversation next week?",
    tone: value.tone || "Warm, direct, and helpful",
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
    context: campaignContext(value),
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
  const campaign = await updateCampaign(user.id, id, {
    name: value.name,
    category: value.category,
    locations: value.locations.split(",").map((location) => location.trim()).filter(Boolean),
    radiusKm: value.radiusKm,
    leadLimit: value.leadLimit,
    context: campaignContext(value),
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
