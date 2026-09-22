"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearDemoSession, getCurrentUser } from "@/lib/auth";
import { campaignContext, campaignSchema } from "@/lib/campaign-form";
import { archiveCampaign, createCampaign, getCampaign, updateCampaign } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
