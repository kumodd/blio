import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { campaignContext, campaignSchema } from "@/lib/campaign-form";
import { createCampaign } from "@/lib/data";

export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const formData = await request.formData();
    const values = campaignSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!values.success) return NextResponse.json({ error: values.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
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
    return NextResponse.json({ campaign: { id: campaign.id } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create campaign." }, { status: 500 });
  }
}
